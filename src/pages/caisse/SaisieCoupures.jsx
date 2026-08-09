import { formaterMontant } from '../../lib/format'

const COUPURES = [
  { cle: 'billet10000', label: '10 000 FCFA', valeur: 10000 },
  { cle: 'billet5000', label: '5 000 FCFA', valeur: 5000 },
  { cle: 'billet2000', label: '2 000 FCFA', valeur: 2000 },
  { cle: 'billet1000', label: '1 000 FCFA', valeur: 1000 },
  { cle: 'billet500', label: '500 FCFA', valeur: 500 },
]

/**
 * Saisie du detail des coupures (billets CEMAC + montant total des pieces), utilisee
 * a l'identique pour l'ouverture ET la fermeture de caisse.
 */
export default function SaisieCoupures({ valeurs, onChange }) {
  const total = COUPURES.reduce((s, c) => s + (Number(valeurs[c.cle]) || 0) * c.valeur, 0) + (Number(valeurs.pieces) || 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="table-erp">
          <thead><tr><th>Coupure</th><th>Quantite</th><th>Sous-total</th></tr></thead>
          <tbody>
            {COUPURES.map((c) => (
              <tr key={c.cle}>
                <td className="font-medium">{c.label}</td>
                <td>
                  <input
                    type="number" min="0"
                    value={valeurs[c.cle] ?? ''}
                    onChange={(e) => onChange({ ...valeurs, [c.cle]: e.target.value })}
                    className="input !w-24"
                  />
                </td>
                <td className="font-mono">{formaterMontant((Number(valeurs[c.cle]) || 0) * c.valeur)}</td>
              </tr>
            ))}
            <tr>
              <td className="font-medium">Pieces (montant total)</td>
              <td colSpan={2}>
                <input
                  type="number" min="0"
                  value={valeurs.pieces ?? ''}
                  onChange={(e) => onChange({ ...valeurs, pieces: e.target.value })}
                  className="input !w-32"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="rounded-lg bg-forest-50 p-3 text-right text-sm font-bold text-forest-800">
        Total declare : <span className="font-mono">{formaterMontant(total)}</span>
      </div>
    </div>
  )
}
