let currentSlide = 0;
let slides = [];

fetch("/posts/posts.json")
  .then(r => r.json())
  .then(posts => {
    slides = posts
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const wrapper = document.querySelector(".slides-wrapper");
    const dotsContainer = document.getElementById("slide-dots");

    if (!wrapper) return;

    slides.forEach((post, index) => {
      // Slide
      const slide = document.createElement("div");
      slide.className = "slide";
      slide.innerHTML = `
        <a href="${post.url}"><img src="${post.image}" alt=""></a>
        <div class="slide-title">
          <a>${post.title}</a>
        </div>
      `;
      wrapper.appendChild(slide);

      // Dot
      const dot = document.createElement("span");
      dot.className = "slide-dot";
      dot.addEventListener("click", () => showSlide(index));
      dotsContainer.appendChild(dot);
    });

    showSlide(0);

    // Arrows
    document.querySelector(".slide-arrow.left")
      .addEventListener("click", prevSlide);

    document.querySelector(".slide-arrow.right")
      .addEventListener("click", nextSlide);

    // Optional auto-rotate
    setInterval(nextSlide, 7000);
  })
  .catch(err => console.error("Slideshow error:", err));

function showSlide(index) {
  const slideEls = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".slide-dot");

  if (slideEls.length === 0) return;

  slideEls.forEach(s => s.style.display = "none");
  dots.forEach(d => d.classList.remove("active"));

  currentSlide = (index + slideEls.length) % slideEls.length;

  slideEls[currentSlide].style.display = "block";
  dots[currentSlide].classList.add("active");
}

function nextSlide() {
  showSlide(currentSlide + 1);
}

function prevSlide() {
  showSlide(currentSlide - 1);
}
