import React, { useState } from 'react';
import { 
  Settings, 
  Plus, 
  Check, 
  X, 
  Camera, 
  ShieldCheck, 
  FileText, 
  ToggleLeft, 
  ToggleRight, 
  Edit3,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ChecklistItemTemplate, ChecklistType } from '../types';

export const AdminTemplateEditor: React.FC = () => {
  const {
    templates,
    updateTemplateItem,
    createTemplateItem,
    toggleTemplateItemActive,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ChecklistType>('opening');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItemTemplate | null>(null);

  // Form states for new/edit item
  const [formCategory, setFormCategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formIsMandatory, setFormIsMandatory] = useState(true);
  const [formRequiresPhoto, setFormRequiresPhoto] = useState(false);
  const [formRequiresRemarks, setFormRequiresRemarks] = useState(false);
  const [formRequiresVerification, setFormRequiresVerification] = useState(false);
  const [formFrequency, setFormFrequency] = useState<'every_shift' | 'daily' | 'weekly'>('every_shift');

  const filteredTemplates = templates.filter(t => t.checklistType === activeTab);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormCategory(filteredTemplates[0]?.category || 'General Operational Tasks');
    setFormTitle('');
    setFormInstructions('');
    setFormIsMandatory(true);
    setFormRequiresPhoto(false);
    setFormRequiresRemarks(false);
    setFormRequiresVerification(false);
    setFormFrequency('every_shift');
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: ChecklistItemTemplate) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormTitle(item.title);
    setFormInstructions(item.instructions);
    setFormIsMandatory(item.isMandatory);
    setFormRequiresPhoto(item.requiresPhoto);
    setFormRequiresRemarks(item.requiresRemarks);
    setFormRequiresVerification(item.requiresManagerVerification);
    setFormFrequency(item.frequency);
    setShowAddModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCategory.trim()) return;

    if (editingItem) {
      updateTemplateItem({
        ...editingItem,
        category: formCategory,
        title: formTitle,
        instructions: formInstructions,
        isMandatory: formIsMandatory,
        requiresPhoto: formRequiresPhoto,
        requiresRemarks: formRequiresRemarks,
        requiresManagerVerification: formRequiresVerification,
        frequency: formFrequency,
      });
    } else {
      createTemplateItem({
        checklistType: activeTab,
        category: formCategory,
        categoryOrder: 1,
        title: formTitle,
        instructions: formInstructions,
        isMandatory: formIsMandatory,
        requiresPhoto: formRequiresPhoto,
        requiresRemarks: formRequiresRemarks,
        requiresManagerVerification: formRequiresVerification,
        frequency: formFrequency,
        isActive: true,
        displayOrder: filteredTemplates.length + 1,
      });
    }

    setShowAddModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
            ADMINISTRATOR CONFIGURATION
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Checklist Templates & SOP Designer
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure checklist categories, criteria rules, mandatory photo evidence requirements, and manager sign-off triggers.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Checklist Item</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-800 text-xs">
        {[
          { id: 'opening' as ChecklistType, label: 'Opening Shift Template' },
          { id: 'mid_shift' as ChecklistType, label: 'Mid-Shift Template' },
          { id: 'handover' as ChecklistType, label: 'Handover Template' },
          { id: 'closing' as ChecklistType, label: 'Closing Shift Template' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg divide-y divide-neutral-800">
        {filteredTemplates.map(item => (
          <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-800/30 transition-colors">
            <div className="space-y-1 max-w-2xl">
              <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-2">
                <span>{item.category}</span>
                {item.isMandatory && (
                  <span className="text-amber-400 font-sans text-[10px] bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                    Mandatory
                  </span>
                )}
                {item.requiresPhoto && (
                  <span className="text-blue-400 font-sans text-[10px] bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20 flex items-center gap-1">
                    <Camera className="w-2.5 h-2.5" /> Photo Required
                  </span>
                )}
                {item.requiresManagerVerification && (
                  <span className="text-emerald-400 font-sans text-[10px] bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> MOS Verification
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-white">{item.title}</h4>
              <p className="text-xs text-neutral-400">{item.instructions}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <button
                onClick={() => toggleTemplateItemActive(item.id)}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-mono transition-colors ${
                  item.isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-500 bg-neutral-800'
                }`}
                title={item.isActive ? 'Active task' : 'Disabled task'}
              >
                {item.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                <span>{item.isActive ? 'Enabled' : 'Disabled'}</span>
              </button>

              <button
                onClick={() => handleOpenEdit(item)}
                className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                title="Edit item rules"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                {editingItem ? 'Edit Checklist Criteria' : 'New Operational Criteria'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  placeholder="e.g. A. Attendance and Shift Preparation"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Inspect thermal paper rolls and reserve stock"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Operational Instructions</label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={e => setFormInstructions(e.target.value)}
                  placeholder="Clear SOP guidelines for the cashier on how to complete and verify this item..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-neutral-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsMandatory}
                    onChange={e => setFormIsMandatory(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-700 text-amber-500 w-4 h-4"
                  />
                  <span className="text-neutral-200">Mandatory Task</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRequiresPhoto}
                    onChange={e => setFormRequiresPhoto(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-700 text-amber-500 w-4 h-4"
                  />
                  <span className="text-neutral-200">Requires Photo Proof</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRequiresRemarks}
                    onChange={e => setFormRequiresRemarks(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-700 text-amber-500 w-4 h-4"
                  />
                  <span className="text-neutral-200">Requires Remarks</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRequiresVerification}
                    onChange={e => setFormRequiresVerification(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-700 text-amber-500 w-4 h-4"
                  />
                  <span className="text-neutral-200">MOS Verification</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-400 text-neutral-950 hover:bg-amber-300"
                >
                  Save Criteria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
