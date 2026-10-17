import { Users, Wifi } from 'lucide-react';
import { RoomMember } from '../../types';

interface RoomMembersProps {
  members: RoomMember[];
  onInviteFriend: () => void;
}

export default function RoomMembers({ members, onInviteFriend }: RoomMembersProps) {
  return (
    <div className="bg-[#0D121F] border border-slate-800/80 rounded-xl p-3.5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <h4 className="text-xs font-semibold text-slate-200">Listening Peers</h4>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-400 font-mono tabular-nums">{members.length} online</span>
        </div>

        <button
          onClick={onInviteFriend}
          className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          + Invite Friend
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {members.map((member) => (
          <div
            key={member.id}
            className={`p-2 rounded-lg bg-slate-900/60 border ${
              member.isSelf ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-800'
            } flex items-center gap-2.5 transition-all`}
          >
            <div className="relative shrink-0">
              <img
                src={member.avatar}
                alt={member.name}
                className={`w-8 h-8 rounded-full object-cover border ${
                  member.role === 'host'
                    ? 'border-amber-400/80'
                    : member.role === 'dj'
                    ? 'border-emerald-400/80'
                    : 'border-slate-700'
                }`}
                referrerPolicy="no-referrer"
              />
              {member.isDancing && (
                <span
                  title="Vibing to the beat"
                  className="absolute -bottom-1 -right-1 text-[10px] select-none"
                >
                  🎧
                </span>
              )}
            </div>

            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium text-slate-200 truncate">{member.name}</p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span
                  className={
                    member.role === 'host'
                      ? 'text-amber-400 font-mono'
                      : member.role === 'dj'
                      ? 'text-emerald-400 font-mono'
                      : 'text-slate-400 font-mono'
                  }
                >
                  {member.role.toUpperCase()}
                </span>
                <span>·</span>
                <span className="flex items-center gap-0.5 font-mono tabular-nums">
                  <Wifi className="w-2.5 h-2.5 text-slate-400" />
                  {member.pingMs}ms
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
