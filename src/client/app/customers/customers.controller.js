(function() {
    'use strict';

    angular
        .module('app.customers')
        .controller('Customers', Customers);

    function foo() {
        var y = 2;
        var x = 1;
    }

    Customers.$inject = ['$state', 'dataservice', 'logger'];
    /* @ngInject */
    function Customers($state, dataservice, logger) {
        var vm = this;
        vm.customers = [];
        vm.gotoCustomer = gotoCustomer;
        vm.title = 'Customers';

        activate();

        function activate() {
            return getCustomers().then(function() {
                logger.info('Activated Customers View');
            });
        }

        function getCustomers() {
            return dataservice.getCustomers().then(function(data) {
                vm.customers = data;
                return vm.customers;
            });
        }

        function gotoCustomer(c) {
            $state.go('customer.detail', {id: c.id});
        }
    }
})();
