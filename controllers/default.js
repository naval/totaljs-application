var path = require('path');
var request = require('request');
var Converter = require("csvtojson").Converter;
var algoliasearch = require('algoliasearch');
var client = algoliasearch(CONFIG('algolia.appID'), CONFIG('algolia.adminKey'));
var index = client.initIndex('products');

exports.install = function () {
    F.route('/', view_index, ['#session']);
    F.route('/login', view_login, ['post', 'get', '#flash', '#session']);
    F.route('/signup', view_signup, ['post', 'get', '#flash', '#session']);
    F.route('/import-product', view_import_product, ['upload', 'get', '#flash', '#session'], 1024);
    F.route('/logout', view_logout, ['get', '#flash', '#session']);
    F.route('/csv', download_csv);
};

/**
 * Download example csv file
 */
function download_csv() {
    this.file('product.csv');
}

/**
 * Default homepage
 */
function view_index() {
    var self = this;
    self.view('index');
}
/**
 * User login handler
 */
function view_login() {
    var self = this;
    MODULE('flash').expire = '3 seconds';
    if (self.req.method === 'POST') {
        var User = MODEL('user').schema;
        User.checkLogin(self.body, function (err, user) {
            if (err) {
                self.flash('error', err);
                self.view('login');
            } else if (user) {
                self.session.user = user;
                self.redirect('import-product');
            } else {
                self.flash('error', 'Invalid email or password!');
                self.view('login');
            }
        });
    } else {
        self.view('login');
    }
}

/**
 * User signup handler
 */
function view_signup() {
    var self = this;
    MODULE('flash').expire = '3 seconds';
    if (self.req.method === 'POST') {
        var User = MODEL('user').schema;
        User.create(self.body, function (err, users) {
            if (err) {
                self.view('signup');
            } else {
                self.flash('success', 'You has been signup successfully.');
                self.redirect('login');
            }
        });
    } else {
        self.view('signup');
    }
}

/**
 * Import product csv handler
 */
function view_import_product() {
    var self = this;
    var user;
    if (self.session.user) {
        user = self.session.user;
    } else {
        self.redirect('login');
        return;
    }
    MODULE('flash').expire = '3 seconds';
    if (self.req.method === 'POST') {
        var Product = MODEL('product').schema;
        var importType = self.req.body.importType || '';
        var converter = new Converter();
        converter.on("end_parsed", function (jsonArray) {
            var productArray = [];
            console.log(jsonArray);
            jsonArray.forEach(function (data) {
                var isValid = isCSVValid(data);
                console.log(isValid, data);
                if (isValid) {
                    data._userId = user._id;
                    productArray.push(data);
                }
            });
            if (productArray.length) {
                Product.create(productArray, function (err, result) {
                    if (err) {
                        self.flash('error', err);
                    } else {
                        index.addObjects(result, function (err, content) {
                            console.log('error=' + err);
                        });
                        self.flash('success', 'File has been imported successfully.');
                    }
                    self.view('import_product');
                });
            } else {
                self.flash('error', 'Csv file is empty or invalid data.');
                self.view('import_product');
            }
        });
        if (importType === 'file') {
            if (self.files.length) {
                var file = self.files[0];
                if (file.type === 'application/vnd.ms-excel' || file.type === 'text/csv') {
                    file.stream().pipe(converter);
                } else {
                    self.flash('error', 'Invalid file type.Only csv file supported!');
                    self.view('import_product');
                }
            } else {
                self.flash('error', 'Please select csv file/url.');
                self.view('import_product');
            }
        } else {
            var csvUrl = self.req.body.url || '';
            if (csvUrl) {
                request.get(csvUrl).pipe(converter);
            } else {
                self.flash('error', 'Please enter csv file url.');
                self.view('import_product');
            }
        }

    } else {
        self.view('import_product');
    }
}

/**
 * User logout handler
 */
function view_logout() {
    var self = this;
    if (self.session.user) {
        delete self.session.user;
    }
    self.redirect('login');
}

function isCSVValid(data) {
    if (data.title && data.description && data.price && data.image_url && Utils.isURL(data.image_url)) {
        var price = data.price;
        if ((!isNaN(price)) && price > 0 && price < 1000000) {
            return true;
        }
    }
    return false;
}