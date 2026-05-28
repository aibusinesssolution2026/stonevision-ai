'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'

interface Stone {
  id: string
  scan_code: string
  variety: string
  quality_grade: string
  length_cm: number
  width_cm: number
  height_cm: number
  volume_cft: number
  total_value_inr: number
  scanned_at: string
  image_url: string
  public_link: string
}

export default function StoneCard({ stone, onRefresh }: { stone: Stone; onRefresh: () => void }) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const supabase = createClient()

  const share = async () => {
    const text = `🪨 *StoneVision AI*\nVariety: *${stone.variety}*\nGrade: ${stone.quality_grade}\nDims: ${stone.length_cm}×${stone.width_cm}×${stone.height_cm} cm\nEst. Value: ₹${(stone.total_value_inr/1e5).toFixed(1)}L\n🔗 ${stone.public_link}\n\n_⚠ AI estimates — verify before commercial use_`
    if (navigator.share) {
      try { await navigator.share({ text }); return } catch (_) {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const getPdf = async () => {
    setPdfLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const res = await fetch(`/api/pdf/${stone.scan_code}`, {
        headers: { Authorization: `Bearer ${session!.access_token}` }
      })
      if (!res.ok) throw new Error('PDF failed')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `StoneVision-${stone.scan_code}.pdf`
      a.click()
    } catch (e: any) { alert(e.message) }
    finally { setPdfLoading(false) }
  }

  const gradeColor = stone.quality_grade === 'A1' ? 'text-green-400 border-green-800/40 bg-green-900/20'
    : stone.quality_grade === 'A2' ? 'text-amber-400 border-amber-800/40 bg-amber-900/20'
    : 'text-red-400 border-red-800/40 bg-red-900/20'

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b border-stone-800">
        {stone.image_url ? (
          <img src={stone.image_url} alt={stone.variety} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-xl flex-shrink-0">🪨</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-serif text-white text-sm truncate">{stone.variety}</p>
          <p className="text-stone-500 text-xs">{stone.length_cm}×{stone.width_cm}×{stone.height_cm} cm · {stone.volume_cft} cft</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${gradeColor}`}>
          {stone.quality_grade}
        </span>
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <div>
          <p className="text-xs text-stone-500">{new Date(stone.scanned_at).toLocaleDateString('en-IN')}</p>
          <p className="text-xs text-gold font-medium">₹{(stone.total_value_inr/1e5).toFixed(1)}L est.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={getPdf} disabled={pdfLoading}
            className="bg-blue-900/20 border border-blue-800/30 text-blue-400 text-xs rounded-lg px-2.5 py-1.5 disabled:opacity-50">
            {pdfLoading ? '⏳' : '📄'}
          </button>
          <button onClick={share}
            className="bg-green-900/20 border border-green-800/30 text-green-400 text-xs rounded-lg px-2.5 py-1.5">
            💬
          </button>
        </div>
      </div>
    </div>
  )
}
