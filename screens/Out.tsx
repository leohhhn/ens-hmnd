export interface Status {
  text: string
  cls?: 'ok' | 'bad'
}

export function Out({ o }: { o: Status | null }) {
  return o ? <pre className={o.cls}>{o.text}</pre> : null
}
