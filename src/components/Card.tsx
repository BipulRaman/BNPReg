interface CardProps {
  title: string
  emoji?: string
  children: React.ReactNode
}

export default function Card({ title, emoji, children }: CardProps) {
  return (
    <section className="card">
      <h2 className="card-title">
        {title} {emoji && <span>{emoji}</span>}
      </h2>
      <div className="card-body">{children}</div>
    </section>
  )
}
