'use client'

import { useState } from 'react'
import { Search, MapPin, Briefcase, ExternalLink, Quote, GraduationCap } from 'lucide-react'

interface Member {
  id: string
  full_name: string | null
  nickname: string | null
  avatar_url: string | null
  role: string | null
  school_role?: string | null
  current_job?: string | null
  location?: string | null
  quote?: string | null
  facebook_url?: string | null
}

export default function MembersList({
  members,
  currentUserId,
}: {
  members: Member[]
  currentUserId: string | null
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredMembers = members.filter((member) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    const nameMatch = member.full_name?.toLowerCase().includes(term)
    const nickMatch = member.nickname?.toLowerCase().includes(term)
    const roleMatch = member.school_role?.toLowerCase().includes(term)
    const jobMatch = member.current_job?.toLowerCase().includes(term)
    const locMatch = member.location?.toLowerCase().includes(term)
    return nameMatch || nickMatch || roleMatch || jobMatch || locMatch
  })

  return (
    <div>
      {/* Search Input */}
      <div className="mb-8 max-w-md mx-auto sm:mx-0">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, biệt danh, nơi ở, vai trò..."
            className="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground shadow-sm"
          />
        </div>
      </div>

      {/* Grid of Member Cards (Yearbook / Student card style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMembers.map((member) => {
          const isCurrentUser = member.id === currentUserId
          const displayName = member.full_name || 'Thành viên lớp 9A'

          return (
            <div
              key={member.id}
              className={`bg-card rounded-2xl border transition-all duration-300 hover:shadow-md flex flex-col overflow-hidden group ${
                isCurrentUser ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
              }`}
            >
              {/* Card Header with Avatar */}
              <div className="p-6 flex flex-col items-center text-center bg-secondary/10 relative">
                {isCurrentUser && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Bạn
                  </span>
                )}
                {member.role === 'admin' && (
                  <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}

                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md bg-secondary/30 mb-3 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-serif font-bold text-foreground/40">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <h3 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {displayName}
                </h3>

                {member.nickname && (
                  <p className="text-xs text-foreground/70 font-medium mt-0.5 bg-background px-2.5 py-0.5 rounded-full border border-border/60">
                    "{member.nickname}"
                  </p>
                )}

                {member.school_role && (
                  <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{member.school_role}</span>
                  </p>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between text-xs text-foreground/80 space-y-3">
                <div className="space-y-2">
                  {member.current_job && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-foreground/50 flex-shrink-0" />
                      <span className="line-clamp-1">{member.current_job}</span>
                    </div>
                  )}

                  {member.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-foreground/50 flex-shrink-0" />
                      <span className="line-clamp-1">{member.location}</span>
                    </div>
                  )}
                </div>

                {member.quote && (
                  <div className="pt-2 border-t border-border/60">
                    <div className="flex gap-1.5 items-start">
                      <Quote className="w-3 h-3 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                      <p className="font-handwriting text-base text-foreground/85 line-clamp-2 leading-snug">
                        "{member.quote}"
                      </p>
                    </div>
                  </div>
                )}

                {member.facebook_url && (
                  <div className="pt-2">
                    <a
                      href={member.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium hover:underline text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Trang cá nhân</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {filteredMembers.length === 0 && (
          <div className="col-span-full py-16 text-center bg-card rounded-2xl border border-dashed border-border">
            <p className="text-foreground/60 text-sm">
              Không tìm thấy thành viên nào phù hợp với từ khóa "{searchTerm}".
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
