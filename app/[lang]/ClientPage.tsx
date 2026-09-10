'use client';

import { useEffect, useRef, useCallback, useState } from "react";
import Image from "next/image";
import LogoMark from "./LogoMark";
import HeroBackground from "./HeroBackground";
import type { Dictionary } from "./dictionaries";

export default function ClientPage({ dict }: { dict: Dictionary }) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [lightboxClosing, setLightboxClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processPhotos = [
    { src: "/trabajos/01-demolicion.jpg", tag: dict.process.step1_tag, label: dict.process.step1_label },
    { src: "/trabajos/02-estructura-v2.jpg", tag: dict.process.step2_tag, label: dict.process.step2_label },
    { src: "/trabajos/03-aislamiento-v2.jpg", tag: dict.process.step3_tag, label: dict.process.step3_label },
    { src: "/trabajos/04-acabados-v2.jpg", tag: dict.process.step4_tag, label: dict.process.step4_label },
    { src: "/trabajos/05-resultado-recamara-v2.jpg", tag: dict.process.result1_tag, label: dict.process.result1_label },
    { src: "/trabajos/06-resultado-bano-v2.jpg", tag: dict.process.result2_tag, label: dict.process.result2_label },
    { src: "/trabajos/07-resultado-cocina-v2.jpg", tag: dict.process.result3_tag, label: dict.process.result3_label },
  ];

  const processVideos = [
    { src: "/trabajos/video-antes-exterior.mp4", poster: "/trabajos/video-antes-exterior-poster.jpg", tag: dict.process.video1_tag, label: dict.process.video1_label },
    { src: "/trabajos/video-despues-exterior.mp4", poster: "/trabajos/video-despues-exterior-poster.jpg", tag: dict.process.video2_tag, label: dict.process.video2_label },
    { src: "/trabajos/video-recorrido-sala.mp4", poster: "/trabajos/video-recorrido-sala-poster.jpg", tag: dict.process.video3_tag, label: dict.process.video3_label },
    { src: "/trabajos/video-recorrido-bano.mp4", poster: "/trabajos/video-recorrido-bano-poster.jpg", tag: dict.process.video4_tag, label: dict.process.video4_label },
  ];

  // Closing plays a short reverse transition before actually unmounting the
  // lightbox, so it fades/shrinks away instead of just vanishing.
  const closeLightbox = useCallback(() => {
    setLightboxClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setLightbox(null);
      setLightboxClosing(false);
    }, 220);
  }, []);

  const openLightbox = useCallback((i: number) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setLightboxClosing(false);
    setLightbox(i);
  }, []);

  const showPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLightbox((i) => (i === null ? null : (i - 1 + processPhotos.length) % processPhotos.length));
  }, [processPhotos.length]);

  const showNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLightbox((i) => (i === null ? null : (i + 1) % processPhotos.length));
  }, [processPhotos.length]);

  useEffect(() => {
    if (lightbox === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % processPhotos.length));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? null : (i - 1 + processPhotos.length) % processPhotos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, processPhotos.length, closeLightbox]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Custom Cursor (skip on touch devices, there is no persistent pointer to track)
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const cur = cursorRef.current;
    const ring = ringRef.current;
    if (cur && ring) {
      let rx = -100;
      let ry = -100;
      const onMouseMove = (e: MouseEvent) => {
        cur.style.left = e.clientX + "px";
        cur.style.top = e.clientY + "px";
        rx += (e.clientX - rx) * 0.12;
        ry += (e.clientY - ry) * 0.12;
        ring.style.left = rx + "px";
        ring.style.top = ry + "px";
      };
      document.addEventListener("mousemove", onMouseMove);
      
      const animRing = () => {
        rx += (parseFloat(cur.style.left || "0") - rx) * 0.1;
        ry += (parseFloat(cur.style.top || "0") - ry) * 0.1;
        ring.style.left = rx + "px";
        ring.style.top = ry + "px";
        requestAnimationFrame(animRing);
      };
      requestAnimationFrame(animRing);
      return () => document.removeEventListener("mousemove", onMouseMove);
    }
  }, []);

  useEffect(() => {
    // Scroll effects
    const nav = navRef.current;

    const onScroll = () => {
      const sy = window.scrollY;
      if (nav) nav.classList.toggle("sc", sy > 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Reveal on scroll
    const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".rv").forEach((el) => obs.observe(el));

    // Number counters
    const cobs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const target = parseInt(el.dataset.t || "0");
            let start: number | null = null;
            const step = (ts: number) => {
              if (!start) start = ts;
              const p = Math.min((ts - start) / 2000, 1);
              const e = 1 - Math.pow(1 - p, 3);
              el.textContent = Math.round(e * target).toString();
              if (p < 1) requestAnimationFrame(step);
              else el.textContent = target.toString();
            };
            requestAnimationFrame(step);
            cobs.unobserve(el);
          }
        });
      }, { threshold: 0.5 }
    );
    document.querySelectorAll<HTMLElement>("[data-t]").forEach((el) => cobs.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      obs.disconnect();
      cobs.disconnect();
    };
  }, []);

  const goTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setMenuOpen(false);
  }, []);

  return (
    <>
      <div id="cur" ref={cursorRef}></div>
      <div id="cur-ring" ref={ringRef}></div>

      {/* ANIMATED BACKGROUND */}
      <div className="parallax-bg">
        <HeroBackground />
      </div>

      {/* NAV */}
      <nav id="nav" ref={navRef}>
        <div className="nav-inner">
          <button type="button" className="logo" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setMenuOpen(false); }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", border: "1px solid rgba(212,175,55,0.2)" }}>
              <LogoMark size={48} />
            </div>
            RMT <span>Solutions</span>
          </button>
          <ul className="nav-links">
            <li><button onClick={() => goTo("about")}>{dict.nav.about}</button></li>
            <li><button onClick={() => goTo("services")}>{dict.nav.services}</button></li>
            <li><button onClick={() => goTo("process")}>{dict.nav.process}</button></li>
            <li><button onClick={() => goTo("projects")}>{dict.nav.projects}</button></li>
          </ul>
          <button className="nav-btn" onClick={() => goTo("contact")}>{dict.nav.cta}</button>
          <button
            type="button"
            className={`nav-burger${menuOpen ? " open" : ""}`}
            aria-label={menuOpen ? dict.nav.menu_close : dict.nav.menu_open}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div id="mobile-menu" className={`mobile-menu${menuOpen ? " open" : ""}`} inert={!menuOpen}>
        <button onClick={() => goTo("about")}>{dict.nav.about}</button>
        <button onClick={() => goTo("services")}>{dict.nav.services}</button>
        <button onClick={() => goTo("process")}>{dict.nav.process}</button>
        <button onClick={() => goTo("projects")}>{dict.nav.projects}</button>
        <button className="btn-gold" onClick={() => goTo("contact")}>{dict.nav.cta}</button>
      </div>

      {/* HERO */}
      <section id="hero">
        <div className="hero-content">
          <div className="sec-eyebrow rv">
            <div className="sec-line"></div>
            <span className="sec-tag">{dict.hero.tag}</span>
          </div>
          <h1 className="hero-title rv rv1">
            {dict.hero.title1} <em>{dict.hero.title_em}</em> <br/>{dict.hero.title2}
          </h1>
          <p className="hero-sub rv rv2">
            {dict.hero.sub}
          </p>
          <div className="hero-btns rv rv3">
            <button className="btn-gold" onClick={() => goTo("contact")}>
              {dict.hero.btn1}
            </button>
            <button className="btn-outline" onClick={() => goTo("projects")}>
              {dict.hero.btn2}
            </button>
          </div>
        </div>
        <div className="scroll-ind rv rv3">
          <span className="scroll-txt">{dict.hero.scroll}</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about">
        <div className="about-imgs rv">
          <div className="about-img-wrap">
            <Image src="/trabajos/about-closet.jpg" alt="Interior Design" fill sizes="(max-width: 1024px) 100vw, 45vw" style={{objectFit: 'cover'}} />
          </div>
          <div className="about-badge">
            <span className="about-badge-n">{dict.about.badge_n}</span>
            <span className="about-badge-l" style={{whiteSpace: 'pre-line'}}>{dict.about.badge_l}</span>
          </div>
        </div>
        <div>
          <div className="sec-eyebrow rv">
            <div className="sec-line"></div>
            <span className="sec-tag">{dict.about.tag}</span>
          </div>
          <h2 className="sec-title rv rv1">{dict.about.title} <em>{dict.about.title_em}</em></h2>
          <p className="sec-sub rv rv2">
            {dict.about.sub}
          </p>
          <div className="val rv rv1">
            <span className="val-n">01</span>
            <div>
              <div className="val-h">{dict.about.val1_h}</div>
              <p>{dict.about.val1_p}</p>
            </div>
          </div>
          <div className="val rv rv2">
            <span className="val-n">02</span>
            <div>
              <div className="val-h">{dict.about.val2_h}</div>
              <p>{dict.about.val2_p}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services">
        <div className="sec-eyebrow rv">
          <div className="sec-line"></div>
          <span className="sec-tag">{dict.services.tag}</span>
        </div>
        <h2 className="sec-title rv rv1">{dict.services.title} <em>{dict.services.title_em}</em></h2>
        <div className="srv-grid">
          <div className="srv rv">
            <span className="srv-n">01</span>
            <h3>{dict.services.srv1_h}</h3>
            <p>{dict.services.srv1_p}</p>
          </div>
          <div className="srv rv rv1">
            <span className="srv-n">02</span>
            <h3>{dict.services.srv2_h}</h3>
            <p>{dict.services.srv2_p}</p>
          </div>
          <div className="srv rv rv2">
            <span className="srv-n">03</span>
            <h3>{dict.services.srv3_h}</h3>
            <p>{dict.services.srv3_p}</p>
          </div>
        </div>
      </section>

      {/* PROCESS — real, unstaged photos from a project we completed */}
      <section id="process">
        <div className="sec-eyebrow rv">
          <div className="sec-line"></div>
          <span className="sec-tag">{dict.process.tag}</span>
        </div>
        <h2 className="sec-title rv rv1">{dict.process.title} <em>{dict.process.title_em}</em></h2>
        <p className="sec-sub rv rv2">{dict.process.sub}</p>

        <div className="rv">
          <div className="process-steps-title">{dict.process.steps_title}</div>
          <div className="process-steps">
            {processPhotos.slice(0, 4).map((p, i) => (
              <button type="button" className="ps" key={p.src} onClick={() => openLightbox(i)}>
                <div className="ps-vis">
                  <Image src={p.src} alt={p.label} fill sizes="(max-width: 768px) 50vw, 25vw" />
                  <span className="ps-n">{p.tag}</span>
                  <span className="ps-zoom" aria-hidden="true">⤢</span>
                </div>
                <div className="ps-info"><span className="ps-label">{p.label}</span></div>
              </button>
            ))}
          </div>
        </div>

        <div className="rv rv1">
          <div className="process-result-title">{dict.process.result_title}</div>
          <div className="process-result">
            {processPhotos.slice(4).map((p, i) => (
              <button type="button" className="pr" key={p.src} onClick={() => openLightbox(i + 4)}>
                <div className="pr-vis">
                  <Image src={p.src} alt={p.label} fill sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <span className="pr-zoom" aria-hidden="true">⤢</span>
                <div className="pr-overlay">
                  <span className="pr-tag">{p.tag}</span>
                  <span className="pr-label">{p.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rv rv2 process-videos">
          <div className="process-result-title">{dict.process.video_title}</div>
          <p className="sec-sub" style={{ marginBottom: 32 }}>{dict.process.video_sub}</p>
          <div className="video-grid">
            {processVideos.map((v) => (
              <div className="vc" key={v.src}>
                <div className="vc-stage">
                  <video
                    src={v.src}
                    poster={v.poster}
                    controls
                    preload="none"
                    playsInline
                    aria-label={`${v.tag} — ${v.label}`}
                  />
                </div>
                <div className="vc-info">
                  <span className="vc-tag">{v.tag}</span>
                  <span className="vc-label">{v.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTBOX — a contained, floating preview card for the process/result
          photos above, not a fullscreen takeover. Closing plays a short
          reverse transition (see closeLightbox) before unmounting. */}
      {lightbox !== null && (
        <div
          className={`lightbox${lightboxClosing ? " lightbox-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={processPhotos[lightbox].label}
          onClick={closeLightbox}
        >
          <div className="lightbox-panel" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-stage">
              <Image
                key={processPhotos[lightbox].src}
                src={processPhotos[lightbox].src}
                alt={processPhotos[lightbox].label}
                fill
                sizes="(max-width: 768px) 94vw, 1200px"
                style={{ objectFit: "contain" }}
                priority
              />
              <button type="button" className="lightbox-close" aria-label={dict.process.close} onClick={closeLightbox}>×</button>
              <button type="button" className="lightbox-nav lightbox-prev" aria-label={dict.process.prev} onClick={showPrev}>‹</button>
              <button type="button" className="lightbox-nav lightbox-next" aria-label={dict.process.next} onClick={showNext}>›</button>
            </div>
            <div className="lightbox-caption">
              <span className="pr-tag">{processPhotos[lightbox].tag}</span>
              <span className="pr-label">{processPhotos[lightbox].label}</span>
            </div>
          </div>
        </div>
      )}

      {/* PROJECTS */}
      <section id="projects">
        <div className="sec-eyebrow rv">
          <div className="sec-line"></div>
          <span className="sec-tag">{dict.projects.tag}</span>
        </div>
        <h2 className="sec-title rv rv1">{dict.projects.title} <em>{dict.projects.title_em}</em></h2>
        
        <div className="proj-grid">
          <div className="pc rv">
            <div className="pc-vis">
              <Image src="/trabajos/proyecto-exterior.jpg" alt="Exterior" fill sizes="100vw" />
            </div>
            <div className="pc-overlay">
              <span className="pc-tag">{dict.projects.p1_tag}</span>
              <div className="pc-name">{dict.projects.p1_name}</div>
              <div className="pc-desc">{dict.projects.p1_desc}</div>
            </div>
          </div>
          
          <div className="pc rv rv1">
            <div className="pc-vis">
              <Image src="/trabajos/proyecto-cocina.jpg" alt="Kitchen" fill sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="pc-overlay">
              <span className="pc-tag">{dict.projects.p2_tag}</span>
              <div className="pc-name">{dict.projects.p2_name}</div>
              <div className="pc-desc">{dict.projects.p2_desc}</div>
            </div>
          </div>
          
          <div className="pc rv rv2">
            <div className="pc-vis">
              <Image src="/trabajos/proyecto-bano.jpg" alt="Bathroom" fill sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="pc-overlay">
              <span className="pc-tag">{dict.projects.p3_tag}</span>
              <div className="pc-name">{dict.projects.p3_name}</div>
              <div className="pc-desc">{dict.projects.p3_desc}</div>
            </div>
          </div>
          
          <div className="pc rv">
            <div className="pc-vis">
              <Image src="/trabajos/proyecto-interior.jpg" alt="Interior" fill sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="pc-overlay">
              <span className="pc-tag">{dict.projects.p4_tag}</span>
              <div className="pc-name">{dict.projects.p4_name}</div>
              <div className="pc-desc">{dict.projects.p4_desc}</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats">
        <div>
          <span className="st-n" data-t="84">0</span>
          <span className="st-l">{dict.stats.s1}</span>
        </div>
        <div>
          <span className="st-n" data-t="5">0</span>
          <span className="st-l">{dict.stats.s2}</span>
        </div>
        <div>
          <span className="st-n" data-t="98">0</span>
          <span className="st-l">{dict.stats.s3}</span>
        </div>
      </section>

      {/* CONTACT / FOOTER */}
      <footer id="contact">
        <div className="ft-grid">
          <div className="ft-brand">
            <div className="logo">
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", border: "1px solid rgba(212,175,55,0.2)" }}>
                <LogoMark size={40} />
              </div>
              RMT <span>Solutions</span>
            </div>
            <p>{dict.footer.desc}</p>
          </div>
          <div className="ft-col">
            <h5>{dict.footer.explore}</h5>
            <ul>
              <li><button onClick={() => goTo("hero")}>{dict.footer.home}</button></li>
              <li><button onClick={() => goTo("about")}>{dict.nav.about}</button></li>
              <li><button onClick={() => goTo("projects")}>{dict.nav.projects}</button></li>
            </ul>
          </div>
          <div className="ft-col">
            <h5>{dict.footer.contact}</h5>
            <ul>
              <li><a href="tel:+14076758086">+1 (407) 675-8086</a></li>
              <li><a href="mailto:rogeliomotatorres@gmail.com">rogeliomotatorres@gmail.com</a></li>
              <li><span>{dict.footer.location}</span></li>
            </ul>
          </div>
        </div>
        <div className="ft-bottom">
          <span>{dict.footer.rights}</span>
          <span>{dict.footer.design}</span>
        </div>
      </footer>
    </>
  );
}