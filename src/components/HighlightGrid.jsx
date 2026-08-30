export default function HighlightGrid({ items, variant }) {
  return (
    <div className="grid-media" data-grid={items.length} data-media="">
      {items.map((item, i) => (
        <div className="highlight-cell" key={i} data-reveal="">
          <article className={`highlight-card highlight-card--${variant}`}>
            <div className="highlight-media">
              {item.image && <img src={item.image} alt={item.title} loading="lazy" />}
            </div>
            {item.caption && <div className="highlight-card-caption">{item.caption}</div>}
            <div className="highlight-copy">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}
