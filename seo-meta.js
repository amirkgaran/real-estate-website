(() => {
  "use strict";

  const BASE = "https://www.myinvest.ca";
  const DEFAULT_IMAGE = `${BASE}/amir-geran-header-logo.png`;

  const pageData = {
    "index.html": {
      title: "Amir Geran | Investment & Real Estate",
      description: "Explore residential, multi-residential and commercial real estate opportunities, investment insights and webinars with Amir Geran, Broker.",
      canonical: `${BASE}/`
    },
    "about.html": {
      title: "About | Amir Geran",
      description: "Learn about Amir Geran, Broker with International Realty Firm, and his investment-focused approach to residential and commercial real estate.",
      canonical: `${BASE}/about.html`
    },
    "contact.html": {
      title: "Contact | Amir Geran",
      description: "Contact Amir Geran, Broker with International Realty Firm, to discuss residential, commercial and real estate investment opportunities.",
      canonical: `${BASE}/contact.html`
    },
    "residential.html": {
      title: "Residential | Amir Geran",
      description: "Explore residential properties for sale and lease with Amir Geran, Broker, including current buying and rental opportunities.",
      canonical: `${BASE}/residential.html`
    },
    "multi-residential.html": {
      title: "Multi Residential | Amir Geran",
      description: "Explore multi-residential real estate opportunities with a focus on rental income, cash flow, operating costs and long-term value.",
      canonical: `${BASE}/multi-residential.html`
    },
    "commercial.html": {
      title: "Commercial | Amir Geran",
      description: "Explore commercial real estate opportunities with a focus on location, tenancy, income potential and long-term business value.",
      canonical: `${BASE}/commercial.html`
    },
    "financial-market.html": {
      title: "Financial Market | Amir Geran",
      description: "Explore financial-market information and investment perspectives that can complement a broader real estate strategy.",
      canonical: `${BASE}/financial-market.html`
    },
    "webinars.html": {
      title: "Webinars | Amir Geran",
      description: "View upcoming real estate and investment webinars hosted by Amir Geran and register for practical educational sessions.",
      canonical: `${BASE}/webinars.html`
    },
    "insights.html": {
      title: "Investment Insights | Amir Geran",
      description: "Real estate and investment insights from Amir Geran covering buying, selling, residential investing, commercial real estate, financing and market strategy.",
      canonical: `${BASE}/insights.html`
    },
    "listing-detail.html": {
      title: "Property Listing | Amir Geran",
      description: "View property details, photos, price, location and investment highlights on MyInvest with Amir Geran, Broker.",
      canonical: window.location.href.split("#")[0]
    }
  };

  const file = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const noIndex = file === "admin.html" || file === "thank-you.html";
  const data = pageData[file] || pageData["index.html"];

  function findMeta(attr, key) {
    return Array.from(document.head.querySelectorAll("meta"))
      .find(el => el.getAttribute(attr) === key);
  }

  function setMeta(attr, key, content) {
    if (!content) return;
    let meta = findMeta(attr, key);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(attr, key);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  }

  function setCanonical(url) {
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;
  }

  function applyCommon(metaData) {
    if (noIndex) {
      setMeta("name", "robots", "noindex,nofollow,noarchive");
      return;
    }

    document.title = metaData.title;
    setMeta("name", "description", metaData.description);
    setMeta("name", "robots", "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
    setMeta("name", "author", "Amir Geran");
    setMeta("name", "theme-color", "#fffdf8");

    setCanonical(metaData.canonical);

    setMeta("property", "og:locale", "en_CA");
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", "MyInvest");
    setMeta("property", "og:title", metaData.title);
    setMeta("property", "og:description", metaData.description);
    setMeta("property", "og:url", metaData.canonical);
    setMeta("property", "og:image", DEFAULT_IMAGE);
    setMeta("property", "og:image:alt", "Amir Geran Real Estate Broker logo");

    setMeta("name", "twitter:card", "summary");
    setMeta("name", "twitter:title", metaData.title);
    setMeta("name", "twitter:description", metaData.description);
    setMeta("name", "twitter:image", DEFAULT_IMAGE);
  }

  function installStructuredData() {
    if (file !== "index.html" || noIndex || document.getElementById("myinvestStructuredData")) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "myinvestStructuredData";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "name": "MyInvest",
          "url": `${BASE}/`
        },
        {
          "@type": "Person",
          "name": "Amir Geran",
          "jobTitle": "Broker",
          "url": `${BASE}/`,
          "telephone": "+1-416-616-4634",
          "email": "amirkgaran@gmail.com",
          "worksFor": {
            "@type": "Organization",
            "name": "International Realty Firm"
          }
        }
      ]
    });
    document.head.appendChild(script);
  }

  function updateListingMetadata() {
    if (file !== "listing-detail.html") return false;

    const titleEl = document.getElementById("listingDetailTitle");
    const descriptionEl = document.getElementById("listingDetailDescription");
    const imageEl = document.querySelector("#listingDetailGallery img");

    const listingTitle = titleEl?.textContent?.trim();
    const listingDescription = descriptionEl?.textContent?.trim();

    if (!listingTitle) return false;

    const title = `${listingTitle} | Amir Geran`;
    const description = listingDescription
      ? listingDescription.replace(/\s+/g, " ").slice(0, 160)
      : data.description;

    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);

    if (imageEl?.src) {
      setMeta("property", "og:image", imageEl.src);
      setMeta("name", "twitter:image", imageEl.src);
    }

    return true;
  }

  applyCommon(data);
  installStructuredData();

  if (file === "listing-detail.html") {
    if (!updateListingMetadata()) {
      const target = document.getElementById("listingDetail") || document.body;
      const observer = new MutationObserver(() => {
        if (updateListingMetadata()) {
          window.setTimeout(() => updateListingMetadata(), 500);
          observer.disconnect();
        }
      });
      observer.observe(target, { childList: true, subtree: true, characterData: true, attributes: true });
      window.setTimeout(() => observer.disconnect(), 15000);
    }
  }
})();
