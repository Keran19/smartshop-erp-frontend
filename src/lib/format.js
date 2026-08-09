export function formaterMontant(valeur) {
  const nombre = Number(valeur ?? 0)
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(nombre) + ' FCFA'
}

export function formaterDate(valeur) {
  if (!valeur) return '-'
  const date = new Date(valeur)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formaterDateCourte(valeur) {
  if (!valeur) return '-'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(valeur)
  )
}

/** Date du jour au format ISO yyyy-MM-dd, pour pre-remplir les champs <input type="date">. */
export function aujourdhuiISO() {
  return new Date().toISOString().slice(0, 10)
}

export function premierJourDuMoisISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
