export default function ExportButtons({
  range,
  scope,
}: {
  range: number
  scope: 'daily' | 'devices' | 'locations' | 'search'
}) {
  const url = (format: string) =>
    `/api/admin/analytics/export?range=${range}&scope=${scope}&format=${format}`
  return (
    <div className="an-export-bar">
      <a className="btn btn-accent" href={url('xlsx')}>
        ⬇ Excel ({range}d)
      </a>
      <a className="btn btn-outline" href={url('pdf')}>
        ⬇ PDF ({range}d)
      </a>
      <a className="btn btn-outline" href={url('csv')}>
        ⬇ CSV ({range}d)
      </a>
      <a className="btn btn-outline" href={url('json')}>
        ⬇ JSON ({range}d)
      </a>
    </div>
  )
}
