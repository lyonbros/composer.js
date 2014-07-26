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
		router.unbind('fail');
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

		router.unbind('fail');
		router.bind('fail', function(err) { error = err });
		router.route('/');
		expect(loaded_home).toBe(1);
		router.route('/users');
		expect(loaded_users).toBe(1);
		router.route('/users/27');
		expect(loaded_user).toBe('27');

		expect(error).toBe(false);
	});

	it('will handle rebased urls properly', function() {
		router.options.base = '/slappy';

		var loaded_home = 0;
		var loaded_users = 0;
		var loaded_user = false;
		var error = false;
		handlers = {
			home: function() { loaded_home++; },
			users: function() { loaded_users++; },
			load_user: function(uid) { loaded_user = uid; }
		};

		var get_path = function()
		{
			if(History.emulated.pushState)
			{
				return window.location.hash.replace(/^[#!]+/, '');
			}
			else
			{
				return window.location.pathname;
			}
		};

		router.unbind('fail');
		router.bind('fail', function(err) { error = err });
		router.route('/');
		expect(get_path()).toBe('/slappy/');
		expect(loaded_home).toBe(1);
		router.route('/users');
		expect(get_path()).toBe('/slappy/users');
		expect(loaded_users).toBe(1);
		router.route('/users/27');
		expect(get_path()).toBe('/slappy/users/27');
		expect(loaded_user).toBe('27');

		expect(error).toBe(false);

		router.options.base = false;
	});

	// bring us back to the original route!
	it('will fail on unknown route', function() {
		var error = false;
		router.unbind('fail');
		router.bind('fail', function(err) { error = err; });
		router.route(initial);

		expect(error.url).toBeTruthy();
		expect(error.route).toBeFalsy();
	});

	it('can parse querystring variables', function() {
		var qs = '?get=job&num_friends=0&dog=lucy';
		expect(router.get_param(qs, 'get')).toBe('job');
		expect(router.get_param(qs, 'num_friends')).toBe('0');
		expect(router.get_param(qs, 'dog')).toBe('lucy');
	});
});

