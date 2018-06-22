let restaurant;
let reviews;
var newMap;
var dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoicGZ1dGVya28iLCJhIjoiY2ppYW4zazVjMTB3ZTN2czl3a3ltdHBxcyJ9.4t8oMQa0-RGfXjCu1HPihA',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
  fetchReviewsFromURL((error, reviews) => {
    if (error) { // Got an error!
      console.error(error);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Get current reviews from page URL.
 */
fetchReviewsFromURL = (callback) => {
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchReviewsById(id, (error, reviews) => {
      self.reviews = reviews;
      if (!reviews) {
        console.error(error);
        return;
      }
      fillReviewsHTML();
      callback(null, reviews)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  if (restaurant.photograph) {
    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant, '-270x248.jpg');
    image.alt = 'Image of ' + restaurant.name + ' restaurant';
  }

  const source = document.getElementById('restaurant-src');
  source.media = '(min-width: 600px)';
  source.srcset = DBHelper.imageUrlForRestaurant(restaurant, '-800x600.jpg');

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  const favorite = document.getElementById('favorite-this');
  if (restaurant.is_favorite === "true" || restaurant.is_favorite === true) {
    favorite.innerHTML = 'Remove From Favorites';
  } else {
    favorite.innerHTML = 'Add To Favorites';
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });

  var review = localStorage.getItem('review');
  if (review) {
    ul.appendChild(createReviewHTML(JSON.parse(review)));
  }
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const nameBlock = document.createElement('div');
  nameBlock.classList.add("reviews-name-block");
  li.appendChild(nameBlock);

  const ratingBlock = document.createElement('div');
  ratingBlock.classList.add("reviews-rating-block");
  li.appendChild(ratingBlock);

  const commentsBlock = document.createElement('div');
  commentsBlock.classList.add("reviews-comments-block");
  li.appendChild(commentsBlock);

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.classList.add("reviews-name");
  nameBlock.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.updatedAt).toLocaleDateString('en-US', dateOptions);
  date.classList.add("reviews-date");
  nameBlock.appendChild(date);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.classList.add("reviews-rating");
  ratingBlock.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  commentsBlock.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Add restaurant to favorites
 */
function favorite() {
  const favorite = document.getElementById('favorite-this');
  if (self.restaurant.is_favorite === "true" || self.restaurant.is_favorite === true) {
    favorite.innerHTML = 'Add To Favorites';
    self.restaurant.is_favorite = false;
    DBHelper.updateRestaurantFavorite(self.restaurant, false);
  } else {
    favorite.innerHTML = 'Remove From Favorites';
    self.restaurant.is_favorite = true;
    DBHelper.updateRestaurantFavorite(self.restaurant, true);
  }
}

function sendReview() {
  let review = {
    "restaurant_id": self.restaurant.id,
    "name": document.getElementById('review-name').value,
    "rating": document.getElementById('review-rating').value,
    "comments": document.getElementById('review-comments').value,
    "updatedAt": new Date()
  };

  // let reviews = [review];
  // DBHelper.storeReviews(reviews);

  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));

  document.getElementById("review-name").value = '';
  document.getElementById("review-rating").value = '1';
  document.getElementById("review-comments").value = '';

  if (!navigator.onLine) {
    localStorage.setItem('review', JSON.stringify(review));
    return;
  }

  fetch(REVIEWS_URL, {
    body: JSON.stringify(review),
    method: 'post'
  }).then(function (response) {
    return response.json();
  }).then(function (json) {
    location.reload();
  }).catch(function (err) {
    const error = (`Request failed. Returned status of ${err}`);
  });
}

var myVar = setInterval(myTimer, 1000);

function myTimer() {
  if (navigator.onLine) {
    var review = localStorage.getItem('review');
    if (review) {
      fetch(REVIEWS_URL, {
        body: review,
        method: 'post'
      }).then(function (response) {
        return response.json();
      }).then(function (json) {
        localStorage.removeItem('review');
      }).catch(function (err) {
        const error = (`Request failed. Returned status of ${err}`);
      });
    }
  }
}
