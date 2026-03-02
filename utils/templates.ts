// Built-in note templates for common use cases

export interface Template {
    id: string;
    title: string;
    content: string;
    category: 'meeting' | 'journal' | 'project' | 'learning' | 'custom';
    isBuiltIn: boolean;
    icon?: string;
}

export const BUILT_IN_TEMPLATES: Template[] = [
    {
        id: 'daily-journal',
        title: 'Daily Journal',
        category: 'journal',
        isBuiltIn: true,
        icon: '📔',
        content: `<h1>Daily Journal - ${new Date().toLocaleDateString()}</h1>

<h2>🌅 Morning Reflection</h2>
<p>How do I feel today?</p>
<p></p>

<h2>🎯 Today's Goals</h2>
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>

<h2>💭 Thoughts & Ideas</h2>
<p></p>

<h2>🌙 Evening Reflection</h2>
<p>What went well today?</p>
<p></p>
<p>What could be improved?</p>
<p></p>

<h2>✨ Gratitude</h2>
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>`
    },
    {
        id: 'meeting-notes',
        title: 'Meeting Notes',
        category: 'meeting',
        isBuiltIn: true,
        icon: '🤝',
        content: `<h1>Meeting Notes</h1>

<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Attendees:</strong></p>
<p><strong>Duration:</strong></p>

<h2>📋 Agenda</h2>
<ol>
  <li></li>
  <li></li>
  <li></li>
</ol>

<h2>📝 Notes</h2>
<p></p>

<h2>✅ Action Items</h2>
<ul>
  <li>[ ] </li>
  <li>[ ] </li>
  <li>[ ] </li>
</ul>

<h2>🔮 Next Steps</h2>
<p></p>`
    },
    {
        id: 'project-planning',
        title: 'Project Plan',
        category: 'project',
        isBuiltIn: true,
        icon: '🚀',
        content: `<h1>Project Plan</h1>

<h2>📌 Project Overview</h2>
<p><strong>Project Name:</strong></p>
<p><strong>Start Date:</strong></p>
<p><strong>Target Completion:</strong></p>
<p><strong>Status:</strong></p>

<h2>🎯 Objectives</h2>
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>

<h2>📊 Scope</h2>
<p><strong>In Scope:</strong></p>
<ul>
  <li></li>
</ul>
<p><strong>Out of Scope:</strong></p>
<ul>
  <li></li>
</ul>

<h2>🗓️ Timeline</h2>
<table>
  <tr>
    <th>Phase</th>
    <th>Duration</th>
    <th>Deliverables</th>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</table>

<h2>⚠️ Risks & Mitigation</h2>
<p></p>

<h2>📈 Success Metrics</h2>
<ul>
  <li></li>
</ul>`
    },
    {
        id: 'learning-notes',
        title: 'Learning Notes',
        category: 'learning',
        isBuiltIn: true,
        icon: '📚',
        content: `<h1>Learning Notes</h1>

<p><strong>Topic:</strong></p>
<p><strong>Source:</strong></p>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

<h2>🎯 Key Concepts</h2>
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>

<h2>📖 Summary</h2>
<p></p>

<h2>💡 Insights</h2>
<blockquote>
<p></p>
</blockquote>

<h2>🔗 Related Topics</h2>
<ul>
  <li></li>
</ul>

<h2>❓ Questions</h2>
<ul>
  <li></li>
</ul>

<h2>✍️ Practice</h2>
<p>How can I apply this?</p>
<p></p>`
    },
    {
        id: 'weekly-review',
        title: 'Weekly Review',
        category: 'journal',
        isBuiltIn: true,
        icon: '📅',
        content: `<h1>Weekly Review</h1>

<p><strong>Week of:</strong> ${new Date().toLocaleDateString()}</p>

<h2>🏆 Wins & Accomplishments</h2>
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>

<h2>📊 Goals Progress</h2>
<table>
  <tr>
    <th>Goal</th>
    <th>Progress</th>
    <th>Notes</th>
  </tr>
  <tr>
    <td></td>
    <td></td>
    <td></td>
  </tr>
</table>

<h2>🚧 Challenges</h2>
<p>What obstacles did I face?</p>
<p></p>

<h2>💡 Lessons Learned</h2>
<p></p>

<h2>🔮 Next Week's Focus</h2>
<ul>
  <li></li>
  <li></li>
  <li></li>
</ul>

<h2>⚡ Energy & Well-being</h2>
<p>How did I feel this week?</p>
<p></p>`
    },
    {
        id: 'blank',
        title: 'Blank Note',
        category: 'custom',
        isBuiltIn: true,
        icon: '📝',
        content: '<p></p>'
    }
];
