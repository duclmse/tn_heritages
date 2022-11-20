let map = L.map("map").on("click", () => toggleMarkers(null, true));
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19}).addTo(map);

let blueIcon = icon("blue");
let redIcon = icon("red");

console.log(`${heritages.length}`);
let tags = {};
let markers = [];
let showAll = true;
let lat_min = 180, lat_max = -180, lng_min = 180, lng_max = -180;
heritages.map(e => {
  let {location, tag, title, intangible} = e;
  if (location && location.length !== 0) {
    let [lat, lng] = location;
    let popup = makePopup(lat, lng, tag, title);
    let marker = intangible
      ? L.marker(location, {icon: redIcon}).addTo(map).bindPopup(popup)
      : L.marker(location).addTo(map).bindPopup(popup);
    marker.on("click", () => toggleMarkers(marker));
    markers.push(marker);
    e.marker = marker;
    e.display = true;
    e.ltitle = e.title.toLowerCase();
    e.ldescription = e.description.map(e => e.toLowerCase());
    if (!e.ltitle) console.log(`> ${e.ltitle}`);
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
console.log(`========`);
map.fitBounds([[lat_min, lng_min], [lat_max, lng_max]]);
let accItems = [];
let key = 0;
for (let tag in tags) {
  accItems.push(accItem(key++, tag, tags[tag]));
}

let searchForm = `<div class="accordion-item">
  <h2 class="accordion-header" id="panelsStayOpen-headingOne">
      <input class="form-control" type="text" id="search" placeholder="Search">
  </h2>
</div>`;

document.getElementById("accordion").innerHTML = searchForm + accItems.join("");

let search = document.getElementById("search");
search.addEventListener("input", () => {
  let input = search.value.toLowerCase();
  heritages.forEach(h => {
    if (!h.ltitle || !h.ldescription) return;
    if (h.ltitle.includes(input.toLowerCase()) || h.ldescription.some(e => e.includes(input))) {
      if (h.marker && !h.display) {
        h.marker.addTo(map);
        h.display = true;
      }
    } else if (h.display) {
      map.removeLayer(h.marker);
      h.display = false;
    }
  });
});

let modal = document.getElementById("staticBackdrop");
modal.addEventListener("show.bs.modal", (event) => {
  let button = event.relatedTarget;
  let tag = button.getAttribute("data-tag");
  let index = parseInt(button.getAttribute("data-index"));
  let {description, images, marker, source, title, video} = tags[tag][index];
  toggleMarkers(marker);
  modal.querySelector(".modal-title").textContent = title;
  modal.querySelector("#carouselPlaceholder").innerHTML = carousel(images, video);
  modal.querySelector("#description").innerHTML = describe(description, source);
});

function icon(name) {
  return L.icon({
    iconUrl: `./img/marker_${name}.png`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function makePopup(lat, lng, tag, title) {
  return L.popup().setContent(`<p>${title}</p>
    <p>
        <span><a href="" data-bs-toggle="modal" data-bs-target="#staticBackdrop" data-tag="${tag}" data-index="${tags[tag]?.length || 0}">Chi tiết</a></span> | 
        <span><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank">Chỉ đường</a></span>
    </p>`, {keepInView: true});
}

function accItem(key, name, content) {
  return `<div class="accordion-item ">
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
  return (`<li>
      <a data-bs-toggle="modal" data-bs-target="#staticBackdrop" data-tag="${name}" data-index="${index}">${content.title}</a>
    </li>`);
}

function carousel(images, video) {
  if (video) {
    return (`<iframe width="100%" height="100%" src="${video}" allowfullscreen="true" allowscriptaccess="always" ></iframe>
      <p><a href="${video}"></ahref></p>  `);
  }
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
  let l = images.length;
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

function describe(text, source) {
  return text.reduce((r, e) => `${r}<p>${e}</p>`, "") + `<p><a href="${source}">Đọc thêm</a></p>`;
}

function toggleMarkers(marker, show) {
  showAll = show || !showAll;
  for (let m of markers) {
    if (show || showAll) {
      m.addTo(map);
    } else {
      map.removeLayer(m);
    }
  }
  marker?.addTo(map);
  marker?.openPopup();
}
