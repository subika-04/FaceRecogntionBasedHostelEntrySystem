import FaqItem from './FaqItem';

export default function FaqSection({ category }) {
  return (
    <section aria-labelledby={`faq-heading-${category.id}`} className="card p-5">
      <h2
        id={`faq-heading-${category.id}`}
        className="flex items-center gap-2 font-display text-sm font-semibold text-ink dark:text-slate-100"
      >
        <span aria-hidden="true">{category.icon}</span>
        {category.title}
      </h2>
      <div className="mt-2">
        {category.questions.map((item, idx) => (
          <FaqItem
            key={item.q}
            id={`${category.id}-${idx}`}
            question={item.q}
            answer={item.a}
            defaultOpen={category.questions.length === 1}
          />
        ))}
      </div>
    </section>
  );
}
