// jshint esversion: 6

var eventInitialized = new Event("initialized");
var md = window.markdownit("commonmark");
var owner = "nicholaschiasson";
var api = "https://api.github.com/repos/";
var repo = owner + "/nicholaschiasson.github.io";
var RepoMeta = get(api + repo + "?" + encodeQueryData({access_token: AccessToken.access_token}));

function onWindowResize() {
  let wrapperDiv = document.getElementById("wrapper");

  let wrapperDivWidth = Math.max(Math.min(window.innerWidth, window.innerHeight),
    0.7 * window.innerWidth) / window.innerWidth * 100.0;
  wrapperDiv.style.width = wrapperDivWidth  + "%";
  wrapperDiv.style.marginLeft = (100.0 - wrapperDivWidth) / 2.0 + "%";
}

function onWindowLoad(page) {
  onWindowResize();

  if (!page)
    page = "home.html";

  let filenames = [];
  filenames.push("views/root/header.html");
  filenames.push("views/root/navigation.html");
  filenames.push(page);
  filenames.push("views/root/footer.html");

  let promises = [];
  for (let i = 0; i < filenames.length; i++) {
    promises.push(get(filenames[i]));
  }

  Promise.all(promises).then(function(response) {
    let element = document.getElementById("wrapper");
    for (let i = 0; i < response.length; i++) {
      let renderText = filenames[i].split(".").pop() === "md" ? md.render(response[i]) : response[i];
      let template = document.createElement("template");
      template.innerHTML = renderText;
      for (let i = 0; i < template.content.childNodes.length; i++) {
        let node = template.content.childNodes[i];
        switch (node.nodeName.toLowerCase()) {
          case "title":
          case "style":
          case "meta":
          case "link":
          case "script":
          case "base":
            document.head.appendChild(node);
            break;
          default:
            element.appendChild(node);
            break;
        }
      }
    }
    RepoMeta.then(function(response) {
      let repoMeta = JSON.parse(response);
      let copyrightYear = document.getElementById("year-of-last-update");
      if (copyrightYear && repoMeta && repoMeta.pushed_at)
        copyrightYear.innerHTML = new Date(repoMeta.pushed_at).getFullYear();
    });
    let pageName = window.location.pathname.split("/").pop().split(".")[0] || "index";
    let activeNavigationButton = document.getElementById("nav-button-" + window.location.pathname.split("/").pop().split(".")[0]);
    if (activeNavigationButton) {
      activeNavigationButton.setAttribute("class", "active");
    }
    window.dispatchEvent(eventInitialized);
  }, function(error) {
    console.log(error);
    window.location.href = "404.html";
  });
}

// Taken from https://developers.google.com/web/fundamentals/getting-started/primers/promises
function get(url) {
  console.log(url);
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    let req = new XMLHttpRequest();
    req.open('GET', url);

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        // Resolve the promise with the response text
        resolve(req.response);
      }
      else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"));
    };

    // Make the request
    req.send();
  });
}

/// Taken from http://stackoverflow.com/a/11582513
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

function encodeLocationWithQuery(location, query) {
  return location + "?" + query;
}

/// Taken from https://stackoverflow.com/a/111545
function encodeQueryData(data) {
   let ret = [];
   for (let d in data)
     ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
   return ret.join('&');
}

function initialize(pageContent) {
  window.addEventListener("resize", onWindowResize, true);
  window.addEventListener("deviceorientation", onWindowResize, true);
  window.addEventListener("load", function() { onWindowLoad(pageContent); }, true);
}
