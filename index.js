const map = L.map("map");
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19}).addTo(map);

const popup = L.popup();
map.on("click", (e) => popup.setLatLng(e.latlng).setContent(`${e.latlng.lat} ${e.latlng.lng}`).openOn(map));
console.log(`${tangible.length} tangible/${intangible.length} intangible`);
let tags = {};
let markers = [];
let lat_min = 180, lat_max = -180, lng_min = 180, lng_max = -180;
tangible.map(e => {
  let {location, tag, title} = e;
  if (location && location.length !== 0) {
    let [lat, lng] = location;
    let popup = L.popup().setContent(`
        <p>${title}</p>
        <p>
            <span><a href="" data-bs-toggle="modal" data-bs-target="#staticBackdrop" data-tag="${tag}" data-index="${tags[tag]?.length || 0}">Chi tiết</a></span> | 
            <span><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank">Chỉ đường</a></span>
        </p>`, {keepInView: true})
    let marker = L.marker(location, {riseOnHover: true}).addTo(map).bindPopup(popup);
    marker.on("click", () => toggleMarkers(marker));
    markers.push(marker);
    e.marker = marker;

    if (lat < lat_min) lat_min = lat;
    if (lat > lat_max) lat_max = lat;
    if (lng < lng_min) lng_min = lng;
    if (lng > lng_max) lng_max = lng;
  } else {
    console.log(`${title} @ ${location}`);
  }
  if (tags[tag]) {
    tags[tag].push(e);
  } else {
    tags[tag] = [e];
  }
});
map.fitBounds([[lat_min, lng_min], [lat_max, lng_max]]);
console.log(tags);
let accItems = [];
let key = 0;
for (let tag in tags) {
  accItems.push(accItem(key++, tag, tags[tag]));
}
document.getElementById("accordion").innerHTML = accItems.join("");

function accItem(key, name, content) {
  return `<div class="accordion-item">
    ${accHeader(key, name)}
    ${accBody(key, name, content)}
  </div>`;
}

function accHeader(key, name) {
  return `<h2 class="accordion-header" id="heading${key}">
    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
        data-bs-target="#collapse${key}" aria-expanded="false" aria-controls="collapse${key}">
      ${name}
    </button>
  </h2>`;
}

function accBody(key, name, content) {
  let list = content.map((e, i) => contentList(i, name, e)).join("");
  return `<div id="collapse${key}" class="accordion-collapse collapse" aria-labelledby="heading${key}" data-bs-parent="#accordion">
    <div class="accordion-body scroll">
      <ul>${list}</ul>
    </div>
  </div>`;
}

function contentList(index, name, content) {
  return (
    `<li>
      <a data-bs-toggle="modal" data-bs-target="#staticBackdrop" data-tag="${name}" data-index="${index}">${content.title}</a>
    </li>`
  );
}

function carousel(images) {
  let {indicators, inner} = carouselContent(images);
  return `<div id="carousel" class="carousel slide" data-bs-ride="carousel">
    <div class="carousel-indicators">${indicators}</div>
    <div class="carousel-inner">${inner}</div>
    <button class="carousel-control-prev" type="button" data-bs-target="#carousel" data-bs-slide="prev">
      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Previous</span>
    </button>
    <button class="carousel-control-next" type="button" data-bs-target="#carousel" data-bs-slide="next">
      <span class="carousel-control-next-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Next</span>
    </button>
  </div>`;
}

function carouselContent(images) {
  let inner = [];
  let indicators = [];
  const l = images.length;
  for (let i = 0; i < l; i++) {
    let {description, url} = images[i];
    let inn = i === 0 ? "active" : "";
    let ind = i === 0 ? `class="active" aria-current="true"` : "";
    inner.push(`<div class="carousel-item ${inn}">
      <img src="${url}" class="d-block w-100 img-responsive" alt="${description}">
      <div class="carousel-caption d-none d-md-block shadow">${description}</div>
    </div>`);
    indicators.push(`<button type="button" data-bs-target="#carousel" data-bs-slide-to="${i}" aria-label="${description}" ${ind}></button>`);

  }
  return {indicators: indicators.join(""), inner: inner.join("")};
}

function describe(text) {
  return text.reduce((r, e) => `${r}<p>${e}</p>`, "");
}

let showAll = true;
function toggleMarkers(marker) {
  showAll = !showAll;
  for (let m of markers) {
    if (showAll) {
      m.addTo(map);
    } else {
      map.removeLayer(m);
    }
  }
  marker.addTo(map);
  marker.openPopup();
}

const modal = document.getElementById("staticBackdrop");
modal.addEventListener("show.bs.modal", function (event) {
  const button = event.relatedTarget;
  const tag = button.getAttribute("data-tag");
  const index = parseInt(button.getAttribute("data-index"));
  const data = tags[tag][index];
  toggleMarkers(data.marker);
  modal.querySelector(".modal-title").textContent = data.title;
  modal.querySelector("#carouselPlaceholder").innerHTML = carousel(data.images);
  modal.querySelector("#description").innerHTML = describe(data.description);
});

// map.on('move', function(ev) {
//     console.log(map.getCenter()); // ev is an event object (MouseEvent in this case)
// });
