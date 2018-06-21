/**
 * Common database helper functions.
 */

const DATA_PORT = 1337; // Change this to your server port
const RESTAURANTS_URL = `http://localhost:${DATA_PORT}/restaurants/`;
const REVIEWS_URL = `http://localhost:${DATA_PORT}/reviews/`;

class DBHelper {

  static openDatabase() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('rrx', 1, function (upgradeDb) {
      var storex = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      storex.createIndex('by-id', 'id');

      var storey = upgradeDb.createObjectStore('reviews', {
        keyPath: 'id'
      });
      storey.createIndex('by-id', 'id');
      storey.createIndex('by-restaurant_id', 'restaurant_id', { unique: false });
    });
  }

  /**
   * Store all restaurants.
   */
  static storeRestaurants() {
    fetch(RESTAURANTS_URL, {
      method: 'get'
    }).then(function (response) {
      return response.json();
    }).then(function (json) {
      const restaurants = json;
      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        restaurants.forEach(function (restaurant) {
          store.put(restaurant);
        });
      });

    }).catch(function (err) {
      const error = (`Request failed. Returned status of ${err}`);
    });
  }

  /**
   * Store reviews.
   */
  static storeReviews(reviews) {
    dbPromise.then(function (db) {
      if (!db) return;
      var tx = db.transaction('reviews', 'readwrite');
      var store = tx.objectStore('reviews');
      reviews.forEach(function (review) {
        store.put(review);
      });
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchReviewsById(sid, callback) {
    fetch(REVIEWS_URL + '?restaurant_id=' + sid, {
      method: 'get'
    }).then(function (response) {
      return response.json();
    }).then(function (reviews) {
      DBHelper.storeReviews(reviews);
      if (reviews) {
        callback(null, reviews);
      } else {
        callback('Reviews do not exist', null);
      }
      return reviews;
    }).catch(function (err) {
      const id = parseInt(sid);
      dbPromise.then(db => {
        return db.transaction('reviews').objectStore('reviews').index('by-restaurant_id').getAll(id);
      }).then(function (reviews) {
        if (reviews) {
          callback(null, reviews);
        } else {
          callback('Reviews does not exist', null);
        }
      }).catch(function (err) {
        const error = (`Request failed. Returned status of ${err}`);
        callback(err, null);
      });
      const error = (`Request failed. Returned status of ${err}`);
      callback(err, null);
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
    dbPromise.then(db => {
      return db.transaction('restaurants').objectStore('restaurants').index('by-id').get(id);
    }).then(function (restaurant) {
      if (restaurant) {
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
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      })
    marker.addTo(newMap);
    return marker;
  }

  /**
   * Update restaurants favorite
   * 
   * Favorite a restaurant (PUT)
   * http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=true
   * 
   * Unfavorite a restaurant (PUT)
   * http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=false
   */
  static updateRestaurantFavorite(restaurant, favorite) {
    const url = RESTAURANTS_URL + restaurant.id + '/?is_favorite=' + favorite;
    console.log(url);
    fetch(url, {
      method: 'put'
    }).then(function (response) {
      return response.json();
    }).then(function (json) {
      const restaurant = json;
      console.log('111');
      console.log(restaurant);

      dbPromise.then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        store.put(restaurant);
      });

    }).catch(function (err) {
      const error = (`Request failed. Returned status of ${err}`);
    });
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
