import 'fake-indexeddb/auto';
import { describe, it, expect, assert } from 'vitest';
import { Store as SecStore, _idb } from '../src/secure-webstore';

describe('Store', function () {
  describe('API', () => {
    const storeName = 'test-store';
    const passphrase = 'password';
    const newPass = 'new password';
    const data = { foo: 'bar' };

    it('Should fail to initialize if store name or passphrase are not provided', async () => {
      let store: any;
      let err: any;
      try {
        store = new (SecStore as any)();
      } catch (error) {
        err = error;
      }
      assert.isUndefined(store);
      assert.equal(err.message, 'Store name and passphrase required', 'Reject if no params are provided');

      try {
        store = new SecStore(storeName, undefined as any);
      } catch (error) {
        err = error;
      }
      assert.isUndefined(store);
      assert.equal(err.message, 'Store name and passphrase required', 'Reject if no pass');

      try {
        store = new SecStore(undefined as any, passphrase);
      } catch (error) {
        err = error;
      }
      assert.isUndefined(store);
      assert.equal(err.message, 'Store name and passphrase required', 'Reject if no store');
    });

    it('Should successfully initialize', async () => {
      let err: any;
      let store: any;
      try {
        store = new SecStore(storeName, passphrase);
        await store.init();
      } catch (error) {
        err = error;
      }
      assert.isUndefined(err);
      await store.close();
    });

    it('Should fail to initialize existing store with bad password', async () => {
      let err: any;
      let store: any;
      try {
        store = new SecStore(storeName, 'foo');
        await store.init();
      } catch (error) {
        err = error;
      }
      assert.equal(err.message, 'Wrong passphrase');
      await store?.close();
    });

    it('Should successfully set an encrypted key/value pair', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      await store.set('one', data);

      const _store = new _idb.Store(storeName, storeName);
      const encItem: any = await _idb.get('one', _store);
      assert.exists(encItem.iv);
      assert.exists(encItem.ciphertext);
      await store.close();
    });

    it('Should successfully get an non-existing key/value pair', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      assert.isUndefined(await store.get('baz'));
      await store.close();
    });

    it('Should successfully get an encrypted key/value pair', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      const dec = await store.get('one');
      assert.deepEqual(dec, data);
      await store.close();
    });

    it('Should successfully list all keys in the store', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      const items = await store.keys(); // [ 'one' ]
      assert.equal(items.length, 1);
      await store.close();
    });

    it('Should successfully call delete on a non-existent key from the store', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      await store.del('two');

      const items = await store.keys(); // [ 'one' ]
      assert.equal(items.length, 1);
      await store.close();
    });

    it('Should successfully delete a key from the store', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      await store.del('one');

      const items = await store.keys(); // []
      assert.equal(items.length, 0);
      await store.close();
    });

    it('Should successfully clear the store', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      await store.clear();

      const items = await store.keys(); // []
      assert.equal(items.length, 0);
      await store.close();
    });

    it('Should successfully export data', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      await store.set('one', data);

      const dump = await store.export();

      const keys = await store.keys();
      for (const key of keys) {
        assert.exists(Object.keys(dump), String(key));
      }
      await store.close();
    });

    it('Should fail to import data if none is provided', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      let err: any;
      try {
        await (store as any).import();
      } catch (error) {
        err = error;
      }
      assert.equal(err.message, 'No data provided');

      try {
        await store.import({});
      } catch (error) {
        err = error;
      }
      assert.equal(err.message, 'No data provided');

      try {
        await store.import('foo' as any);
      } catch (error) {
        err = error;
      }
      assert.equal(err.message, 'Data must be a valid JSON object');

      await store.close();
    });

    it('Should successfully import data', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      const keys = await store.keys();
      const dump = await store.export();

      await store.del('one');

      await store.import(dump);

      assert.deepEqual(keys, await store.keys());

      await store.close();
    });

    it('Should fail to updatePassphrase with wrong (previous) password', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      let err: any;
      try {
        await store.updatePassphrase('foo', newPass);
      } catch (error) {
        err = error;
      }
      assert.equal(err.message, 'Wrong passphrase');
      await store.close();
    });

    it('Should successfully updatePassphrase with the new password and retrieve saved data', async () => {
      const store = new SecStore(storeName, passphrase);
      await store.init();

      await store.set('one', data);

      await store.updatePassphrase(passphrase, newPass);

      const dec = await store.get('one');
      assert.deepEqual(dec, data);
      await store.close();
    });
  });
});
