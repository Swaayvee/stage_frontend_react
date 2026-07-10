import { useMemo, useState } from 'react'
import Card from '../components/ui/Card'
import { deliveryModes, relayPoints } from '../data/deliveries'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function inputClasses() {
  return 'w-full rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-[#6C8EFF] focus:bg-[#6C8EFF]/10'
}

function DeliveryForm({ onNavigate }) {
  const [mode, setMode] = useState('home')
  const [relay, setRelay] = useState(relayPoints[0].id)
  const [relayChoice, setRelayChoice] = useState('known')
  const [formData, setFormData] = useState({
    orderReference: '',
    weight: '',
    description: '',
    dimensions: '',
    declaredValue: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    deliveryDate: '',
    timeSlot: 'Matin (8h - 12h)',
    customRelayAddress: '',
  })
  const clientDeliveryModes = useMemo(
    () => Object.values(deliveryModes).filter((item) => ['home', 'relay'].includes(item.id)),
    [],
  )
  const selectedMode = useMemo(() => deliveryModes[mode], [mode])
  const selectedRelay = relayPoints.find((point) => point.id === relay)
  const recipient = [formData.firstName, formData.lastName].filter(Boolean).join(' ')
  const destination = [formData.city, formData.postalCode].filter(Boolean).join(', ')
  const customRelayStatus = formData.customRelayAddress.length > 8 ? 'Adresse prete a verifier' : 'Adresse a completer'
  const modeDetail = mode === 'relay' ? (relayChoice === 'custom' ? formData.customRelayAddress || customRelayStatus : selectedRelay?.name) : 'Livraison a domicile'

  const updateField = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6C8EFF]">Nouvelle demande</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Creer une livraison</h1>
        <p className="mt-2 text-sm text-slate-400">Renseignez les informations de colis et choisissez le mode adapte.</p>

        <div className="mt-8 grid gap-5">
          <Card className="p-6">
            <h2 className="mb-5 text-sm font-bold">Informations du colis</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Reference commande">
                <input
                  className={inputClasses()}
                  value={formData.orderReference}
                  onChange={updateField('orderReference')}
                  placeholder="ex. CMD-2025-042"
                />
              </Field>
              <Field label="Poids estime">
                <input className={inputClasses()} value={formData.weight} onChange={updateField('weight')} placeholder="ex. 2.5 kg" />
              </Field>
              <Field label="Description">
                <textarea
                  className={`${inputClasses()} min-h-24 sm:col-span-2`}
                  value={formData.description}
                  onChange={updateField('description')}
                  placeholder="Vetements, electronique..."
                />
              </Field>
              <Field label="Dimensions">
                <input className={inputClasses()} value={formData.dimensions} onChange={updateField('dimensions')} placeholder="L x l x H" />
              </Field>
              <Field label="Valeur declaree">
                <input
                  className={inputClasses()}
                  value={formData.declaredValue}
                  onChange={updateField('declaredValue')}
                  placeholder="ex. 89.90 EUR"
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-5 text-sm font-bold">Destinataire et adresse</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prenom">
                <input className={inputClasses()} value={formData.firstName} onChange={updateField('firstName')} placeholder="Marie" />
              </Field>
              <Field label="Nom">
                <input className={inputClasses()} value={formData.lastName} onChange={updateField('lastName')} placeholder="Dupont" />
              </Field>
              <Field label="Email">
                <input
                  className={inputClasses()}
                  value={formData.email}
                  onChange={updateField('email')}
                  placeholder="marie.dupont@email.com"
                  type="email"
                />
              </Field>
              <Field label="Telephone">
                <input className={inputClasses()} value={formData.phone} onChange={updateField('phone')} placeholder="+33 6 00 00 00 00" />
              </Field>
              <Field label="Adresse">
                <input className={inputClasses()} value={formData.address} onChange={updateField('address')} placeholder="12 Rue des Fleurs" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Code postal">
                  <input className={inputClasses()} value={formData.postalCode} onChange={updateField('postalCode')} placeholder="69001" />
                </Field>
                <Field label="Ville">
                  <input className={inputClasses()} value={formData.city} onChange={updateField('city')} placeholder="Lyon" />
                </Field>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-5 text-sm font-bold">Mode de livraison</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {clientDeliveryModes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    mode === item.id ? 'border-[#6C8EFF] bg-[#6C8EFF]/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p>
                    </div>
                    <span className="text-sm text-[#34D399]">{mode === item.id ? 'OK' : ''}</span>
                  </div>
                </button>
              ))}
            </div>

            {mode === 'relay' ? (
              <div className="mt-4 grid gap-4">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <div className="mb-3 flex gap-2">
                    <button
                      onClick={() => setRelayChoice('known')}
                      className={`rounded-lg px-3 py-2 text-xs font-bold ${
                        relayChoice === 'known' ? 'bg-[#34D399]/15 text-[#34D399]' : 'bg-white/[0.04] text-slate-400'
                      }`}
                    >
                      Relais recommandes
                    </button>
                    <button
                      onClick={() => setRelayChoice('custom')}
                      className={`rounded-lg px-3 py-2 text-xs font-bold ${
                        relayChoice === 'custom' ? 'bg-[#6C8EFF]/15 text-[#8BA8FF]' : 'bg-white/[0.04] text-slate-400'
                      }`}
                    >
                      Saisir une adresse
                    </button>
                  </div>
                  {relayChoice === 'known' ? (
                    <div className="overflow-hidden rounded-lg border border-white/10">
                      {relayPoints.map((point) => (
                        <button
                          key={point.id}
                          onClick={() => setRelay(point.id)}
                          className={`grid w-full grid-cols-[1fr_auto] gap-3 border-b border-white/10 px-4 py-3 text-left last:border-b-0 ${
                            relay === point.id ? 'bg-[#34D399]/10' : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <span>
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold">{point.name}</span>
                              <span className="rounded-full bg-[#6C8EFF]/15 px-2 py-0.5 text-[10px] font-bold text-[#8BA8FF]">
                                {point.hint}
                              </span>
                              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-slate-400">
                                {point.distance}
                              </span>
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">{point.address}</span>
                            <span className="block text-xs text-[#34D399]">{point.availability}</span>
                          </span>
                          <span className="text-sm text-[#34D399]">{relay === point.id ? 'OK' : ''}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <Field label="Adresse du point relais">
                        <input
                          className={inputClasses()}
                          value={formData.customRelayAddress}
                          onChange={updateField('customRelayAddress')}
                          placeholder="Nom ou adresse du relais souhaite"
                        />
                      </Field>
                      <div
                        className={`rounded-lg border px-4 py-3 text-xs font-bold ${
                          formData.customRelayAddress.length > 8
                            ? 'border-[#34D399]/25 bg-[#34D399]/10 text-[#34D399]'
                            : 'border-[#F59E0B]/25 bg-[#F59E0B]/10 text-[#F59E0B]'
                        }`}
                      >
                        {customRelayStatus} - verification effectuee par le systeme avant validation.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {mode === 'home' ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Date souhaitee">
                  <input className={inputClasses()} value={formData.deliveryDate} onChange={updateField('deliveryDate')} type="date" />
                </Field>
                <Field label="Creneau">
                  <select className={inputClasses()} value={formData.timeSlot} onChange={updateField('timeSlot')}>
                    <option>Matin (8h - 12h)</option>
                    <option>Apres-midi (13h - 17h)</option>
                    <option>Soiree (17h - 20h)</option>
                  </select>
                </Field>
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-[#34D399]/20 bg-[#34D399]/10 px-4 py-3 text-sm leading-6 text-[#B8F8DB]">
                Pour un point relais, le client sera notifie lorsque le colis sera disponible au retrait. La date et le
                creneau sont determines par la prise en charge du commercant.
              </div>
            )}
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => onNavigate('client')} className="rounded-lg border border-white/10 px-5 py-3 text-sm font-bold text-slate-300">
            Retour
          </button>
          <button onClick={() => onNavigate('tracking')} className="rounded-lg bg-gradient-to-r from-[#6C8EFF] to-[#A78BFA] px-5 py-3 text-sm font-bold text-white">
            Continuer
          </button>
        </div>
      </div>

      <aside className="lg:pt-24">
        <Card className="sticky top-24 overflow-hidden">
          <div className="border-b border-white/10 bg-[#6C8EFF]/10 p-5">
            <h2 className="font-bold">Recapitulatif</h2>
            <p className="mt-1 text-sm text-slate-500">Votre demande de livraison</p>
          </div>
          <div className="divide-y divide-white/10 p-5">
            {[
              ['Commande', formData.orderReference || 'A renseigner'],
              ['Destinataire', recipient || 'A renseigner'],
              ['Destination', destination || formData.address || 'A renseigner'],
              ['Mode', selectedMode.label],
              ['Option', modeDetail],
              ...(mode === 'home'
                ? [
                    ['Date', formData.deliveryDate || 'A choisir'],
                    ['Creneau', formData.timeSlot],
                  ]
                : [['Disponibilite', 'Notification a l arrivee au relais']]),
              ['Delai estime', selectedMode.delay],
              ['Total', selectedMode.price],
            ].map(([key, value]) => (
              <div key={key} className="flex justify-between gap-5 py-3 text-sm">
                <span className="text-slate-500">{key}</span>
                <span className="text-right font-bold">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  )
}

export default DeliveryForm
