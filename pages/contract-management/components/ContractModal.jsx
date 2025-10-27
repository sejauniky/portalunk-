import React, { useState } from 'react'
import { X, FileText, DollarSign, Calendar, User, Building, Download, Send, Save } from 'lucide-react'

export default function ContractModal({ isOpen, onClose, event, dj }) {
  const [contractData, setContractData] = useState({
    contract_value: dj?.booking_price || 0,
    payment_terms: '50% na assinatura do contrato, 50% após o evento',
    additional_terms: '',
    equipment_requirements: 'Sistema de som profissional, mesa de mixagem, microfones',
    performance_duration: '4 horas',
    setup_time: '1 hora antes do evento',
    cancellation_policy: 'Cancelamento até 30 dias antes: reembolso total. Cancelamento até 15 dias: 50% de reembolso.',
    dress_code: 'Traje social/casual elegante',
    technical_rider: ''
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    alert('Contrato salvo com sucesso!')
  }

  const handleSend = async () => {
    setIsSending(true)
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSending(false)
    alert('Contrato enviado para o DJ e produtor!')
    onClose()
  }

  const handleDownload = () => {
    // Simular download do PDF
    alert('Download do contrato iniciado!')
  }

  if (!isOpen || !event) return null

  const eventDate = event?.event_date ? new Date(event.event_date) : null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="glass rounded-2xl w-full max-w-4xl my-8 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white neon-text">Contrato de Apresentação</h2>
              <p className="text-gray-400 text-sm">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Event and DJ Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-dark rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                Informações do Evento
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Nome</p>
                  <p className="text-white font-medium">{event.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Data e Hora</p>
                  <p className="text-white font-medium">
                    {eventDate ? (
                      <>
                        {eventDate.toLocaleDateString('pt-BR')} às {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </>
                    ) : 'Data não definida'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Local</p>
                  <p className="text-white font-medium">{event.venue}</p>
                  <p className="text-gray-400 text-sm">{event.city}, {event.state}</p>
                </div>
                {event.expected_attendance && (
                  <div>
                    <p className="text-sm text-gray-400">Público Esperado</p>
                    <p className="text-white font-medium">{event.expected_attendance.toLocaleString('pt-BR')} pessoas</p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-dark rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-400" />
                Informações do DJ
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Nome Artístico</p>
                  <p className="text-white font-medium">{dj?.name || 'DJ não encontrado'}</p>
                </div>
                {dj?.email && (
                  <div>
                    <p className="text-sm text-gray-400">E-mail</p>
                    <p className="text-white font-medium">{dj.email}</p>
                  </div>
                )}
                {dj?.phone && (
                  <div>
                    <p className="text-sm text-gray-400">Telefone</p>
                    <p className="text-white font-medium">{dj.phone}</p>
                  </div>
                )}
                {dj?.genres && dj.genres.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400">Gêneros</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dj.genres.map(genre => (
                        <span key={genre} className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded-full">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contract Terms */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Building className="w-5 h-5 mr-2 text-green-400" />
              Termos do Contrato
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor do Cachê (R$) *
                </label>
                <input
                  type="number"
                  value={contractData.contract_value}
                  onChange={(e) => setContractData(prev => ({ ...prev, contract_value: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                  min="0"
                  step="100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duração da Apresentação
                </label>
                <input
                  type="text"
                  value={contractData.performance_duration}
                  onChange={(e) => setContractData(prev => ({ ...prev, performance_duration: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Ex: 4 horas"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Condições de Pagamento
              </label>
              <textarea
                value={contractData.payment_terms}
                onChange={(e) => setContractData(prev => ({ ...prev, payment_terms: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 resize-none"
                placeholder="Condições de pagamento..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Equipamentos Necessários
              </label>
              <textarea
                value={contractData.equipment_requirements}
                onChange={(e) => setContractData(prev => ({ ...prev, equipment_requirements: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 resize-none"
                placeholder="Lista de equipamentos necessários..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tempo de Setup
                </label>
                <input
                  type="text"
                  value={contractData.setup_time}
                  onChange={(e) => setContractData(prev => ({ ...prev, setup_time: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Ex: 1 hora antes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dress Code
                </label>
                <input
                  type="text"
                  value={contractData.dress_code}
                  onChange={(e) => setContractData(prev => ({ ...prev, dress_code: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Código de vestimenta"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Política de Cancelamento
              </label>
              <textarea
                value={contractData.cancellation_policy}
                onChange={(e) => setContractData(prev => ({ ...prev, cancellation_policy: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 resize-none"
                placeholder="Política de cancelamento..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Termos Adicionais
              </label>
              <textarea
                value={contractData.additional_terms}
                onChange={(e) => setContractData(prev => ({ ...prev, additional_terms: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2.5 bg-black/20 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 resize-none"
                placeholder="Cláusulas adicionais, observações especiais..."
              />
            </div>
          </div>

          {/* Contract Summary */}
          <div className="glass-dark rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-400" />
              Resumo Financeiro
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-black/20 rounded-xl">
                <p className="text-sm text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-green-400">
                  R$ {contractData.contract_value.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-xl">
                <p className="text-sm text-gray-400">Comissão UNK (15%)</p>
                <p className="text-xl font-bold text-purple-400">
                  R$ {(contractData.contract_value * 0.15).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-xl">
                <p className="text-sm text-gray-400">Valor Líquido DJ</p>
                <p className="text-xl font-bold text-blue-400">
                  R$ {(contractData.contract_value * 0.85).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-white/10">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 bg-gray-600/20 border border-gray-500/30 rounded-xl text-gray-300 hover:bg-gray-600/30 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-600 rounded-xl text-gray-300 hover:bg-gray-600/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-white hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-semibold text-white hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Contrato
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
