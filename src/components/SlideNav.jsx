export default function SlideNav({ sections, activeIndex, onSelect }) {
  return (
    <nav className="slide-nav">
      {sections.map((sec, i) => (
        <div
          key={sec.key}
          className={`slide-nav-item${i === activeIndex ? ' active' : ''}`}
          onClick={() => onSelect(i)}
        >
          <span className="slide-nav-label">{sec.label}</span>
          <span className="slide-nav-bar" />
        </div>
      ))}
    </nav>
  );
}
