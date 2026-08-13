/**
 * Each template is just a list of section keys. ReportBuilder.jsx maps each
 * key to the same renderer every other template also uses (see its
 * SECTION_RENDERERS map) -- adding a template means adding one entry here,
 * never a new layout.
 */
export const REPORT_TEMPLATES = [
  {
    id: 'executive',
    label: 'Executive Summary',
    description: 'High-level KPIs and top-line trends for leadership review.',
    sections: ['summary', 'advancedStats', 'topCameras', 'peakHours'],
  },
  {
    id: 'recognitionActivity',
    label: 'Recognition Activity',
    description: 'Operational detail: when, where, and how confidently recognition is happening.',
    sections: ['summary', 'heatmap', 'latency', 'confidence', 'timeline'],
  },
  {
    id: 'studentRecognition',
    label: 'Student Recognition',
    description: 'Recognition history for a specific student (use the Student filter below).',
    sections: ['summary', 'confidence', 'timeline'],
  },
  {
    id: 'departmentSummary',
    label: 'Department Summary',
    description: 'Recognition activity for a specific department (use the Department filter below).',
    sections: ['summary', 'topCameras', 'timeline'],
  },
  {
    id: 'fullAudit',
    label: 'Full Audit Report',
    description: 'Every section, for compliance/audit purposes.',
    sections: ['summary', 'advancedStats', 'heatmap', 'latency', 'confidence', 'topCameras', 'peakHours', 'timeline'],
  },
];

export function getTemplateById(id) {
  return REPORT_TEMPLATES.find((t) => t.id === id) || REPORT_TEMPLATES[0];
}
