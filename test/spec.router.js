var handlers = {};

describe('Composer.Router', function() {
	var routes = {
		'/': ['handlers', 'home'],
		'/users': ['handlers', 'users'],
		'/users/([0-9]+)': ['handlers', 'load_user']
	};
	var router = null;

	// save the original route before testing
	var initial = window.location.pathname;

	it('can be instantiated properly', function() {
		var loaded_users = 0;
		var fails = 0;

		History.pushState({}, null, '/users');

		handlers.users = function() { loaded_users++; };
		router = new Composer.Router(routes);
		router.bind('fail', function() { fails++; });

		expect(router instanceof Composer.Router).toBe(true);
		expect(loaded_users).toBe(1);
		expect(fails).toBe(0);
	});

	it('can route properly', function() {
		var loaded_home = 0;
		var loaded_users = 0;
		var loaded_user = false;
		var error = false;
		handlers = {
			home: function() { loaded_home++; },
			users: function() { loaded_users++; },
			load_user: function(uid) { loaded_user = uid; }
		};

		router.bind('fail', function(err) { error = err });
		router.route('/');
		expect(loaded_home).toBe(1);
		router.route('/users');
		expect(loaded_users).toBe(1);
		router.route('/users/27');
		expect(loaded_user).toBe('27');

		expect(error).toBe(false);
	});

	// bring us back to the original route!
	it('will fail on unknown route', function() {
		var error = false;
		router.bind('fail', function(err) { error = err; });
		router.route(initial);

		expect(error.url).toBeTruthy();
		expect(error.route).toBeFalsy();
	});
});

