/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    // const port = 8000; // Change this to your server port
    // return `http://localhost:${port}/data/restaurants.json`;
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static openDatabase() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
  
    return idb.open('rrx', 1, function(upgradeDb) {
      var storex = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      storex.createIndex('by-id', 'id');
  
      var storey = upgradeDb.createObjectStore('reviews', {
        keyPath: 'uid'
      });
      storey.createIndex('by-uid', 'uid');
      storey.createIndex('by-id', 'id', { unique: false });
    });
  }
  
  /**
   * Fetch all restaurants.
   */
  static storeRestaurants() {
    fetch(DBHelper.DATABASE_URL, {
      method: 'get'
    }).then(function (response) {
      return response.json();
    }).then(function (json) {
      // console.log(json);
      // const restaurants = json.restaurants;
      const restaurants = json;
      console.log('openDatabase');
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        var tx2 = db.transaction('reviews', 'readwrite');
        var store2 = tx2.objectStore('reviews');
        var uid = 0;
        restaurants.forEach(function (message) {
          if (message.reviews) {
            message.reviews.forEach(function (review) {
              review.uid = ++uid;
              review.id = message.id;
              store2.put(review);
            });
          }
          delete message.reviews;
          store.put(message);
        });
      });

    }).catch(function (err) {
      const error = (`Request failed. Returned status of ${err}`);
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    return dbPromise.then(db => {
      return db.transaction('restaurants').objectStore('restaurants').index('by-id').getAll();
    }).then(response => {
      return response;
    }).then(function (restaurants) {
      callback(null, restaurants);
    }).catch(function (err) {
      const error = (`Request failed. Returned status of ${err}`);
      callback(err, null);
    });
  }

  /**
   * Fetch restaurants by Id.
   */
  static fetchRestaurantById(sid, callback) {
    const id = parseInt(sid);
    return Promise.all([
      dbPromise.then(db => {
        return db.transaction('restaurants').objectStore('restaurants').index('by-id').get(id);
      })
      ,
      dbPromise.then(db => {
        return db.transaction('reviews').objectStore('reviews').index('by-id').getAll(id);
      })
    ]).then(function (values) {
      const restaurant = values[0];
      if (restaurant) {
        restaurant.reviews = values[1];
        callback(null, restaurant);
      } else {
        callback('Restaurant does not exist', null);
      }
    }).catch(function (err) {
      const error = (`Request failed. Returned status of ${err}`);
      callback(err, null);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, size) {
    // return (`/img/${restaurant.photograph.slice(0, -4) + size}`);
    return (`/img/${restaurant.photograph + size}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 

}

/**
 * Fetch all neighborhoods and set their HTML.
 */
initRestaurants = () => {
  DBHelper.storeRestaurants((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      console.error(neighborhoods);
    }
  });
}

const dbPromise = DBHelper.openDatabase();
initRestaurants();
