fetch("posts/posts.json")
  .then(r => r.json())
  .then(posts => {
    const container = document.getElementById("newsContainer");

    posts
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach(post => {
        const div = document.createElement("div");
        div.className = "news-item";
        div.innerHTML = `
          <br>
          <a href="${post.url}" style=margin:10%><img style=width:80% src="${post.image}" alt=""></a>
          <h2 style=margin-bottom:0;margin-top:0><a href="${post.url}">${post.title}</a></h2>
          <small>${post.date} · ${post.category}</small>
          <br>
          <hr>
          <br>
        `;
        container.appendChild(div);
      });
  });
 