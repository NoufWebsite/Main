/*
  طريقة الاستخدام:
  addProject(الصورة_الرئيسية, الاسم, الوصف, قائمة_الملفات);

  قائمة الملفات = كل الصور والفيديوهات اللي تبي تظهر في اللوحة الجانبية.
  تقدر تكتبها بسرعة بالدالة: folder("Images/Origami", ["1.webp", "2.webp", "clip.mp4"])
*/

const grid      = document.getElementById("projects");
const panel     = document.getElementById("sidePanel");
const panelBody = document.getElementById("panelBody");
const panelTitle= document.getElementById("panelTitle");
const panelDesc = document.getElementById("panelDesc");
const closeBtn  = document.getElementById("closeBtn");
const backdrop  = document.getElementById("backdrop");

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;
let activeCard = null;
const projects = [];

/* ---------- ظهور البطاقات عند التمرير ---------- */
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

/* ---------- اللوحة الجانبية ---------- */
function openSide(card, project) {
    // إيقاف أي فيديو شغال من قبل
    panelBody.querySelectorAll("video").forEach(v => v.pause());

    if (activeCard) activeCard.classList.remove("active");
    activeCard = card;
    card.classList.add("active");

    panelTitle.textContent = project.name;
    panelDesc.textContent  = project.description;
    panelBody.replaceChildren();

    if (!project.media.length) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent = "لا توجد صور أو فيديوهات هنا بعد.";
        panelBody.append(empty);
    }

    const imageList = project.media.filter(f => !VIDEO_EXT.test(f));

    project.media.forEach((src, i) => {
        const box = document.createElement("figure");
        box.className = "media-item";
        box.style.animationDelay = `${0.15 + i * 0.07}s`;

        let el;
        if (VIDEO_EXT.test(src)) {
            el = document.createElement("video");
            el.controls = true;
            el.preload = "metadata";
            el.playsInline = true;
        } else {
            el = document.createElement("img");
            el.loading = "lazy";
            el.alt = project.name;
            box.classList.add("is-image");
            el.addEventListener("click", () => openLb(imageList, imageList.indexOf(src), project.name));
        }
        el.src = src;
        box.append(el);
        panelBody.append(box);
    });

    panelBody.scrollTop = 0;
    document.body.classList.add("panel-open");
    panel.setAttribute("aria-hidden", "false");
}

function closeSide() {
    document.body.classList.remove("panel-open");
    panel.setAttribute("aria-hidden", "true");
    panelBody.querySelectorAll("video").forEach(v => v.pause());
    if (activeCard) { activeCard.classList.remove("active"); activeCard.focus({ preventScroll: true }); }
    activeCard = null;
}

closeBtn.addEventListener("click", closeSide);
backdrop.addEventListener("click", closeSide);
document.addEventListener("keydown", (e) => {
    if (lbOpen) {
        if (e.key === "Escape") closeLb();
        if (e.key === "ArrowLeft")  showLb(lbIndex + 1);
        if (e.key === "ArrowRight") showLb(lbIndex - 1);
        return;
    }
    if (e.key === "Escape") closeSide();
});

/* ---------- تكبير الصورة ---------- */
const lightbox = document.getElementById("lightbox");
const lbImg    = document.getElementById("lbImg");
const lbCount  = document.getElementById("lbCount");
let lbList = [], lbIndex = 0, lbOpen = false;

function showLb(i) {
    lbIndex = (i + lbList.length) % lbList.length;
    lbImg.classList.add("swap");
    setTimeout(() => {
        lbImg.src = lbList[lbIndex];
        lbCount.textContent = `${lbIndex + 1} / ${lbList.length}`;
        lbImg.classList.remove("swap");
    }, 120);
}
function openLb(list, i, alt) {
    lbList = list; lbOpen = true;
    lbImg.alt = alt;
    lbImg.src = list[i]; lbIndex = i;
    lbCount.textContent = `${i + 1} / ${list.length}`;
    lightbox.classList.toggle("single", list.length < 2);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lb-open");
}
function closeLb() {
    lbOpen = false;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lb-open");
}
document.getElementById("lbClose").addEventListener("click", closeLb);
document.getElementById("lbNext").addEventListener("click", () => showLb(lbIndex + 1)); // RTL: السهم الأيسر = التالي
document.getElementById("lbPrev").addEventListener("click", () => showLb(lbIndex - 1));
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLb(); });

// سحب بالإصبع للجوال
let touchX = null;
lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
});

/* ---------- شريط التقدم + زر الأعلى ---------- */
const progress = document.getElementById("progress");
window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
}, { passive: true });
document.getElementById("toTop").addEventListener("click", () => scrollTo({ top: 0 }));

/* ---------- عدّاد الإحصائيات ---------- */
function countUp(el, to) {
    const start = performance.now(), dur = 1200;
    (function tick(now) {
        const t = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
    })(start);
}
function updateStats() {
    const all = projects.flatMap(p => p.media);
    countUp(document.getElementById("statProjects"), projects.length);
    countUp(document.getElementById("statImages"), all.filter(f => !VIDEO_EXT.test(f)).length);
    countUp(document.getElementById("statVideos"), all.filter(f => VIDEO_EXT.test(f)).length);
}

/* ---------- إضافة مشروع ---------- */
function addProject(image, name, description, media = []) {
    const project = { name, description, media };
    projects.push(project);

    const card = document.createElement("article");
    card.className = "project-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    card.addEventListener("click", () => {
        // الضغط على نفس البطاقة مرة ثانية يقفل اللوحة
        if (activeCard === card) closeSide(); else openSide(card, project);
    });
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); }
    });

    const wrap = document.createElement("div");
    wrap.className = "project-image-wrap";

    const img = document.createElement("img");
    img.className = "project-image";
    img.src = image;
    img.alt = name;
    img.loading = "lazy";
    wrap.append(img);

    if (media.length) {
        const count = document.createElement("span");
        count.className = "project-count";
        count.textContent = `${media.length} ملف`;
        wrap.append(count);
    }

    const body = document.createElement("div");
    body.className = "project-body";

    const title = document.createElement("h3");
    title.className = "project-name";
    title.textContent = name;

    const text = document.createElement("p");
    text.className = "project-description";
    text.textContent = description;

    const more = document.createElement("span");
    more.className = "project-more";
    more.textContent = "افتح المعرض";

    body.append(title, text, more);
    card.append(wrap, body);
    grid.append(card);
    observer.observe(card);
}

/* اختصار: folder("Images/Origami", ["1.webp","2.webp"]) → ["Images/Origami/1.webp", ...] */
function folder(path, files) {
    return files.map(f => `${path.replace(/\/$/, "")}/${f}`);
}

/* ---- أضف مشاريعك هنا ---- */
const OrigamiDes = `فن الأوريغامي هو فن طي الورق. أوريغامي كلمة مشتقة من "ORI" التي نشأت من كلمة "ORU" وتعني الطي، وكلمة "GAMI" التي نشأت من كلمة "KAMI" التي تعني الورق.`;
const PuzzleDes  = `الأحجية هي لغز أو مشكلة معقدة تتطلب تفكيراً منطقياً أو حسابات رياضية للوصول إلى حلها، وهي نوع من التسلية التي تختبر براعة العقل.`;
const BoardDes   = `تحتوي اللعبة اللوحية على عدة أجزاء: اللوح وهو الجزء الأساسي على شكل سطح مستوٍ تُلعب عليه أنشطة اللعبة، وقد تتضمن الألعاب قطع النرد أو دوران عجلة أو إجابة على أسئلة. يقوم اللاعبون بتحريك القطع على اللوحة وفق قوانين اللعبة.`;
const GameDes    = `هي ألعاب تفاعلية تعتمد على الدوائر الإلكترونية أو الحواسيب وتُشغل عبر منصات متنوعة مثل أجهزة الحاسوب، والهواتف الذكية، ووحدات التحكم (مثل بلايستيشن وإكس بوكس)، وأجهزة الأركيد، بالإضافة إلى الشبكات القائمة على الخوادم والإنترنت.`;

// ← اكتب أسماء ملفات كل مجلد هنا (صور وفيديوهات)
addProject("Images/orgimi.webp", "ألعاب الأوريغامي 'Origami'", OrigamiDes,
    folder("Images/orgimi_exm", ["1.webp", "2.webp", "3.webp", "4.webp"]));

addProject("Images/puzzle.webp", "ألعاب الأحاجي", PuzzleDes,
    folder("Images/puzzle_exm", ["1.webp", "2.webp", "3.webp"]));

addProject("Images/cardboard.webp", "ألعاب لوحية 'Cardboard Games'", BoardDes,
    folder("Images/cardboard_exm", ["1.webp", "2.webp", "3.webp", "4.webp"]));

addProject("Images/game.webp", "ألعاب إلكترونية", GameDes,
    folder("Images/game_exm", ["1.webp", "2.webp", "3.webp", "4.webp"]));

updateStats();