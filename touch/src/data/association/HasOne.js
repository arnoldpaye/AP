/**
 * Rewrote by evillegas, to address memory leaks. Now, it's based in a hasMany association internally.
 * Doesn't have all the hasOne features, but it creates a getter which is the most important. For example parent.getVehicle()
 * The original association has been backed up in OriginalHasOne.js
 *
 * @aside guide models
 *
 * Represents a one to one association with another model. The owner model is expected to have
 * a foreign key which references the primary key of the associated model:
 *
 *     Ext.define('Person', {
 *         extend: 'Ext.data.Model',
 *         config: {
 *             fields: [
 *                 { name: 'id', type: 'int' },
 *                 { name: 'name', type: 'string' },
 *                 { name: 'address_id', type: 'int'}
 *             ],
 *
 *             // we can use the hasOne shortcut on the model to create a hasOne association
 *             associations: { type: 'hasOne', model: 'Address' }
 *         }
 *     });
 *
 *     Ext.define('Address', {
 *         extend: 'Ext.data.Model',
 *         config: {
 *             fields: [
 *                 { name: 'id', type: 'int' },
 *                 { name: 'number', type: 'string' },
 *                 { name: 'street', type: 'string' },
 *                 { name: 'city', type: 'string' },
 *                 { name: 'zip', type: 'string' }
 *             ]
 *         }
 *     });
 *
 * In the example above we have created models for People and Addresses, and linked them together
 * by saying that each Person has a single Address. This automatically links each Person to an Address
 * based on the Persons address_id, and provides new functions on the Person model:
 *
 * ## Generated getter function
 *
 * The first function that is added to the owner model is a getter function:
 *
 *     var person = Ext.create('Person', {
 *         id: 100,
 *         address_id: 20,
 *         name: 'John Smith'
 *     });
 *
 *     person.getAddress(function(address, operation) {
 *         // do something with the address object
 *         alert(address.get('id')); // alerts 20
 *     }, this);
 *
 * The getAddress function was created on the Person model when we defined the association. This uses the
 * Persons configured {@link Ext.data.proxy.Proxy proxy} to load the Address asynchronously, calling the provided
 * callback when it has loaded.
 *
 * The new getAddress function will also accept an object containing success, failure and callback properties
 * - callback will always be called, success will only be called if the associated model was loaded successfully
 * and failure will only be called if the associated model could not be loaded:
 *
 *     person.getAddress({
 *         reload: true, // force a reload if the owner model is already cached
 *         callback: function(address, operation) {}, // a function that will always be called
 *         success : function(address, operation) {}, // a function that will only be called if the load succeeded
 *         failure : function(address, operation) {}, // a function that will only be called if the load did not succeed
 *         scope   : this // optionally pass in a scope object to execute the callbacks in
 *     });
 *
 * In each case above the callbacks are called with two arguments - the associated model instance and the
 * {@link Ext.data.Operation operation} object that was executed to load that instance. The Operation object is
 * useful when the instance could not be loaded.
 *
 * Once the getter has been called on the model, it will be cached if the getter is called a second time. To
 * force the model to reload, specify reload: true in the options object.
 *
 * ## Generated setter function
 *
 * The second generated function sets the associated model instance - if only a single argument is passed to
 * the setter then the following two calls are identical:
 *
 *     // this call...
 *     person.setAddress(10);
 *
 *     // is equivalent to this call:
 *     person.set('address_id', 10);
 *
 * An instance of the owner model can also be passed as a parameter.
 *
 * If we pass in a second argument, the model will be automatically saved and the second argument passed to
 * the owner model's {@link Ext.data.Model#save save} method:
 *
 *     person.setAddress(10, function(address, operation) {
 *         // the address has been saved
 *         alert(address.get('address_id')); //now alerts 10
 *     });
 *
 *     //alternative syntax:
 *     person.setAddress(10, {
 *         callback: function(address, operation) {}, // a function that will always be called
 *         success : function(address, operation) {}, // a function that will only be called if the load succeeded
 *         failure : function(address, operation) {}, // a function that will only be called if the load did not succeed
 *         scope   : this //optionally pass in a scope object to execute the callbacks in
 *     });
 *
 * ## Customization
 *
 * Associations reflect on the models they are linking to automatically set up properties such as the
 * {@link #primaryKey} and {@link #foreignKey}. These can alternatively be specified:
 *
 *     Ext.define('Person', {
 *         extend: 'Ext.data.Model',
 *         config: {
 *             fields: [
 *                 // ...
 *             ],
 *
 *             associations: [
 *                 { type: 'hasOne', model: 'Address', primaryKey: 'unique_id', foreignKey: 'addr_id' }
 *             ]
 *         }
 *     });
 *
 * Here we replaced the default primary key (defaults to 'id') and foreign key (calculated as 'address_id')
 * with our own settings. Usually this will not be needed.
 */
Ext.define('Ext.data.association.HasOne', {
    extend: 'Ext.data.association.HasMany',
    alternateClassName: 'Ext.data.HasOneAssociation',

    alias: 'association.hasone',

    config: {

    },

    applyName: function(name) {
        if (!name) {
            name = this.getAssociatedName().toLowerCase();
        }
        return name;
    },


    applyStore: function(storeConfig) {
        var me = this,
            associatedModel = me.getAssociatedModel(),
            storeName       = me.getStoreName();

        return function() {
            var record = this,
                config, store;

            if (record[storeName] === undefined) {

                config = Ext.apply({}, storeConfig, {
                    model        : associatedModel,
                });

                store = record[storeName] = Ext.create('Ext.data.Store', config);
                //store.boundTo = record;

                //Added by evillegas
                record["get" + Ext.String.capitalize(me.getName())] = function(){
                    return store.first();
                }
                record["set" + Ext.String.capitalize(me.getName())] = function(record){
                    store.removeAll();
                    store.add(record);
                }
                record[storeName].load();
            }

            return record[storeName];
        };
    },

});
