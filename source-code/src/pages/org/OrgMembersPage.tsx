import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, MoreVertical, Shield, User } from 'lucide-react';
import { MemberDetailPanel } from '../../components/org/MemberDetailPanel';
import { InviteMemberModal } from '../../components/org/InviteMemberModal';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  lastActive: string;
  tracksCount: number;
}

const members: Member[] = [
  { id: '1', name: 'Alice Cooper', email: 'alice@company.com', role: 'Admin', joinedAt: 'Oct 2023', lastActive: '2h ago', tracksCount: 4 },
  { id: '2', name: 'Bob Johnson', email: 'bob@company.com', role: 'Member', joinedAt: 'Nov 2023', lastActive: '5h ago', tracksCount: 2 },
  { id: '3', name: 'Charlie Brown', email: 'charlie@company.com', role: 'Member', joinedAt: 'Dec 2023', lastActive: '1d ago', tracksCount: 1 },
  { id: '4', name: 'Diana Prince', email: 'diana@company.com', role: 'Admin', joinedAt: 'Jan 2024', lastActive: 'Just now', tracksCount: 5 },
  { id: '5', name: 'Eve Adams', email: 'eve@company.com', role: 'Member', joinedAt: 'Feb 2024', lastActive: '3d ago', tracksCount: 3 },
];

const OrgMembersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Member>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredMembers = members
    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortOrder === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      }
      return sortOrder === 'asc' ? (fieldA as number) - (fieldB as number) : (fieldB as number) - (fieldA as number);
    });

  const openPanel = (member: Member) => {
    setSelectedMember(member);
    setIsPanelOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold">Organization Members</h1>
            <p className="text-gray-400 mt-2">Manage user access and track individual progress.</p>
          </div>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            Invite Members
          </button>
        </header>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search members by name or email..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs font-medium uppercase">
                <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">
                    Name {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('role')}>
                  <div className="flex items-center gap-2">
                    Role {sortField === 'role' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('joinedAt')}>
                  <div className="flex items-center gap-2">
                    Joined {sortField === 'joinedAt' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('lastActive')}>
                  <div className="flex items-center gap-2">
                    Last Active {sortField === 'lastActive' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => openPanel(member)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-indigo-400 border border-white/10">
                        {member.role === 'Admin' ? <Shield size={16} /> : <User size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{member.name}</p>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full border ${member.role === 'Admin' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{member.joinedAt}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{member.lastActive}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MemberDetailPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        member={selectedMember} 
      />

      <InviteMemberModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};

export default OrgMembersPage;
