// jshint esversion: 6

var blogsPath = "views/root/blogs";

function renderBlogList() {
  function createBlogEntryListItem(title, creationDate) {
    let item = document.createElement("li");
    let link = document.createElement("a");
    link.setAttribute("class", "entry-title");
    link.setAttribute("href", window.location + "?entry=" + encodeURI(title));
    link.innerHTML = title.replace(/\.(?=[^.]*$).*/, "");
    item.appendChild(link);
    item.appendChild(document.createElement("br"));
    let span = document.createElement("span");
    span.setAttribute("class", "creation-date");
    span.setAttribute("data-toggle", "tooltip");
    span.setAttribute("title", creationDate.toTimeString());
    span.innerHTML = creationDate.toDateString();
    item.appendChild(span);
    return item;
  }

  function createBlogList(entries) {
    let list = document.createElement("ul");
    entries.sort();
    entries.reverse();
    for (let i = 0; i < entries.length; i++) {
      let date = new Date(entries[i].split(" ")[0]);
      let title = entries[i].replace(/^[^ ]+ /, "");
      list.appendChild(createBlogEntryListItem(title, date));
    }
    return list;
  }

  let contentDiv = document.getElementById("content");

  if (contentDiv) {
    let blog = getURLParameter("entry");

    if (window.location.pathname.split("/").pop() === "blog.html" && blog) {
      let filename = blogsPath + "/" + blog;
      get(filename).then(function(response) {
        contentDiv.innerHTML = "";
        let returnButton = document.createElement("a");
        returnButton.setAttribute("class", "back-button");
        returnButton.setAttribute("href", "blog.html");
        let returnButtonInner = document.createElement("h5");
        returnButtonInner.innerHTML = "back to list";
        returnButton.appendChild(returnButtonInner);
        contentDiv.appendChild(returnButton);
        let renderText = filename.split(".").pop() === "md" ? md.render(response) : response;
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
              contentDiv.appendChild(node);
              break;
          }
        }
        contentDiv.appendChild(returnButton.cloneNode(true));
      }, function(error) {
        window.location.href = "404.html";
      });
    } else {
      let entriesHeading = document.createElement("h4");
      entriesHeading.innerHTML = "Entries";
      contentDiv.appendChild(entriesHeading);
      get(api + repo + "/contents/" + blogsPath + "?" +
        encodeQueryData({access_token: AccessToken.access_token})).then(function(response) {
        let blogMeta = JSON.parse(response);
        let CommitsMeta = [];
        for (let i = 0; i < blogMeta.length; i++) {
          CommitsMeta.push(get(api + repo + "/commits" + "?" +
            encodeQueryData({access_token: AccessToken.access_token, path: blogMeta[i].path})));
        }
        Promise.all(CommitsMeta).then(function(response) {
          let blogEntries = [];
          for (let i = 0; i < response.length; i++) {
            let commitMeta = JSON.parse(response[i]);
            blogEntries.push(commitMeta.pop().commit.committer.date + " " + blogMeta[i].name);
          }
          contentDiv.appendChild(createBlogList(blogEntries));
        });
      });
    }
  }
}

window.addEventListener("initialized", renderBlogList, true);
