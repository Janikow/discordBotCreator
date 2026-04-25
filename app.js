// State
const state = {
  events: [],
  commands: [],
  editingEventIdx: null,
  editingCommandIdx: null,
  currentFile: 'index',
  platform: 'replit', // 'replit' | 'render'
};

// --- PLATFORM SWITCHER ---
function switchPlatform(p) {
  state.platform = p;
  document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.platform-btn[data-platform="${p}"]`)?.classList.add('active');
  document.querySelectorAll('.platform-steps').forEach(s => s.classList.remove('active'));
  document.getElementById(`steps-${p}`)?.classList.add('active');
  generateCode();
}

// --- NAV ---
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = link.dataset.tab;
    switchTab(tab);
  });
});

document.getElementById('headerGenBtn').addEventListener('click', () => {
  switchTab('code');
  generateCode();
});

function switchTab(tab) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelector(`.nav-link[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  if (tab === 'code') generateCode();
}

function scrollToBuilder() {
  document.getElementById('builder').scrollIntoView({ behavior: 'smooth' });
}

// --- CODE TABS ---
document.querySelectorAll('.code-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.currentFile = tab.dataset.file;
    generateCode();
  });
});

// --- MODALS ---
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('open'); });
});

// --- EVENTS ---
document.getElementById('addEventBtn').addEventListener('click', () => {
  state.editingEventIdx = null;
  document.getElementById('eventModalTitle').textContent = 'Add Event Handler';
  document.getElementById('eventType').value = 'messageCreate';
  document.getElementById('eventAction').value = 'sendMessage';
  updateEventFields();
  openModal('eventModal');
});

function updateEventFields() {
  const action = document.getElementById('eventAction').value;
  const container = document.getElementById('eventFields');
  let html = '';

  if (action === 'sendMessage' || action === 'logToChannel') {
    html = `
      <div class="form-group">
        <label>Channel ID (or "same" for current channel)</label>
        <input type="text" id="evtChannelId" placeholder="123456789012345678" class="input" />
      </div>
      <div class="form-group">
        <label>Message Content</label>
        <textarea id="evtMessage" class="input textarea" rows="3" placeholder="Welcome to the server! 🎉"></textarea>
      </div>`;
  } else if (action === 'dmUser') {
    html = `<div class="form-group"><label>DM Message</label>
      <textarea id="evtMessage" class="input textarea" rows="3" placeholder="Welcome! You just joined..."></textarea></div>`;
  } else if (action === 'addRole' || action === 'removeRole') {
    html = `<div class="form-group"><label>Role ID</label>
      <input type="text" id="evtRoleId" placeholder="123456789012345678" class="input" /></div>`;
  } else if (action === 'customCode') {
    html = `<div class="form-group"><label>Custom Code (JS)</label>
      <textarea id="evtCustomCode" class="input textarea" rows="5" placeholder="// Your custom code here\nconsole.log('Event fired!');"></textarea></div>`;
  }

  container.innerHTML = html;
}

function saveEvent() {
  const type = document.getElementById('eventType').value;
  const action = document.getElementById('eventAction').value;

  const evt = { type, action };

  if (action === 'sendMessage' || action === 'logToChannel') {
    evt.channelId = document.getElementById('evtChannelId')?.value || '';
    evt.message = document.getElementById('evtMessage')?.value || '';
  } else if (action === 'dmUser') {
    evt.message = document.getElementById('evtMessage')?.value || '';
  } else if (action === 'addRole' || action === 'removeRole') {
    evt.roleId = document.getElementById('evtRoleId')?.value || '';
  } else if (action === 'customCode') {
    evt.customCode = document.getElementById('evtCustomCode')?.value || '';
  }

  if (state.editingEventIdx !== null) {
    state.events[state.editingEventIdx] = evt;
    showToast('Event updated!');
  } else {
    state.events.push(evt);
    showToast('Event added!');
  }

  closeModal('eventModal');
  renderEvents();
}

function renderEvents() {
  const container = document.getElementById('eventsList');
  if (state.events.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔔</span>No event handlers yet. Add one to get started.</div>`;
    return;
  }
  container.innerHTML = state.events.map((evt, i) => `
    <div class="event-card">
      <div class="event-info">
        <div class="event-name">${evt.type}</div>
        <div class="event-detail">${actionLabel(evt)}</div>
      </div>
      <span class="event-badge">${evt.action}</span>
      <div class="card-actions">
        <button class="btn-icon" onclick="editEvent(${i})" title="Edit">✏️</button>
        <button class="btn-icon delete" onclick="deleteEvent(${i})" title="Delete">🗑️</button>
      </div>
    </div>`).join('');
}

function actionLabel(evt) {
  if (evt.message) return `"${evt.message.slice(0, 50)}${evt.message.length > 50 ? '...' : ''}"`;
  if (evt.roleId) return `Role ID: ${evt.roleId}`;
  if (evt.customCode) return 'Custom code block';
  return evt.action;
}

function editEvent(i) {
  state.editingEventIdx = i;
  const evt = state.events[i];
  document.getElementById('eventModalTitle').textContent = 'Edit Event Handler';
  document.getElementById('eventType').value = evt.type;
  document.getElementById('eventAction').value = evt.action;
  updateEventFields();
  setTimeout(() => {
    if (evt.channelId) document.getElementById('evtChannelId')?.setAttribute('value', evt.channelId);
    if (evt.message) { const el = document.getElementById('evtMessage'); if (el) el.value = evt.message; }
    if (evt.roleId) { const el = document.getElementById('evtRoleId'); if (el) el.value = evt.roleId; }
    if (evt.customCode) { const el = document.getElementById('evtCustomCode'); if (el) el.value = evt.customCode; }
  }, 50);
  openModal('eventModal');
}

function deleteEvent(i) {
  state.events.splice(i, 1);
  renderEvents();
  showToast('Event removed');
}

// --- COMMANDS ---
document.getElementById('addCommandBtn').addEventListener('click', () => {
  state.editingCommandIdx = null;
  document.getElementById('commandModalTitle').textContent = 'Add Command';
  document.getElementById('cmdName').value = '';
  document.getElementById('cmdAliases').value = '';
  document.getElementById('cmdDesc').value = '';
  document.getElementById('cmdResponseType').value = 'text';
  document.getElementById('cmdCooldown').value = '0';
  document.getElementById('cmdPermission').value = '';
  updateCommandFields();
  openModal('commandModal');
});

function updateCommandFields() {
  const type = document.getElementById('cmdResponseType').value;
  const container = document.getElementById('commandFields');
  let html = '';

  if (type === 'text') {
    html = `<div class="form-group"><label>Response Text</label>
      <textarea id="cmdText" class="input textarea" rows="3" placeholder="Hello, {user}!"></textarea>
      <span class="hint">Use {user} for mention, {username} for name, {server} for server name</span>
    </div>`;
  } else if (type === 'embed') {
    html = `
      <div class="form-row">
        <div class="form-group"><label>Embed Title</label>
          <input type="text" id="cmdEmbedTitle" placeholder="My Embed" class="input" /></div>
        <div class="form-group"><label>Embed Color (hex)</label>
          <input type="text" id="cmdEmbedColor" placeholder="#5865f2" class="input" /></div>
      </div>
      <div class="form-group"><label>Embed Description</label>
        <textarea id="cmdEmbedDesc" class="input textarea" rows="3" placeholder="This is an embed response!"></textarea></div>`;
  } else if (type === 'customCode') {
    html = `<div class="form-group"><label>Custom Handler Code</label>
      <textarea id="cmdCustomCode" class="input textarea" rows="5" placeholder="// message or interaction is available\nmessage.reply('Custom response!');"></textarea></div>`;
  }

  container.innerHTML = html;
}

function saveCommand() {
  const name = document.getElementById('cmdName').value.trim();
  if (!name) { showToast('Command name is required!'); return; }

  const cmd = {
    name: name.toLowerCase().replace(/\s+/g, ''),
    aliases: document.getElementById('cmdAliases').value.split(',').map(s => s.trim()).filter(Boolean),
    desc: document.getElementById('cmdDesc').value.trim(),
    responseType: document.getElementById('cmdResponseType').value,
    cooldown: parseInt(document.getElementById('cmdCooldown').value) || 0,
    permission: document.getElementById('cmdPermission').value,
  };

  const type = cmd.responseType;
  if (type === 'text') cmd.text = document.getElementById('cmdText')?.value || '';
  else if (type === 'embed') {
    cmd.embedTitle = document.getElementById('cmdEmbedTitle')?.value || '';
    cmd.embedDesc = document.getElementById('cmdEmbedDesc')?.value || '';
    cmd.embedColor = document.getElementById('cmdEmbedColor')?.value || '#5865f2';
  } else if (type === 'customCode') {
    cmd.customCode = document.getElementById('cmdCustomCode')?.value || '';
  }

  if (state.editingCommandIdx !== null) {
    state.commands[state.editingCommandIdx] = cmd;
    showToast('Command updated!');
  } else {
    state.commands.push(cmd);
    showToast('Command added!');
  }

  closeModal('commandModal');
  renderCommands();
}

function renderCommands() {
  const container = document.getElementById('commandsList');
  if (state.commands.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">⚡</span>No commands yet. Add your first command!</div>`;
    return;
  }
  container.innerHTML = state.commands.map((cmd, i) => `
    <div class="command-card">
      <div class="command-info">
        <div class="command-name">${getPrefix()}${cmd.name}</div>
        <div class="command-detail">${cmd.desc || 'No description'} ${cmd.aliases.length ? `· aliases: ${cmd.aliases.join(', ')}` : ''}</div>
      </div>
      <span class="event-badge">${cmd.responseType}</span>
      <div class="card-actions">
        <button class="btn-icon" onclick="editCommand(${i})" title="Edit">✏️</button>
        <button class="btn-icon delete" onclick="deleteCommand(${i})" title="Delete">🗑️</button>
      </div>
    </div>`).join('');
}

function editCommand(i) {
  state.editingCommandIdx = i;
  const cmd = state.commands[i];
  document.getElementById('commandModalTitle').textContent = 'Edit Command';
  document.getElementById('cmdName').value = cmd.name;
  document.getElementById('cmdAliases').value = cmd.aliases.join(', ');
  document.getElementById('cmdDesc').value = cmd.desc;
  document.getElementById('cmdResponseType').value = cmd.responseType;
  document.getElementById('cmdCooldown').value = cmd.cooldown;
  document.getElementById('cmdPermission').value = cmd.permission;
  updateCommandFields();
  setTimeout(() => {
    if (cmd.text) { const el = document.getElementById('cmdText'); if(el) el.value = cmd.text; }
    if (cmd.embedTitle) { const el = document.getElementById('cmdEmbedTitle'); if(el) el.value = cmd.embedTitle; }
    if (cmd.embedDesc) { const el = document.getElementById('cmdEmbedDesc'); if(el) el.value = cmd.embedDesc; }
    if (cmd.embedColor) { const el = document.getElementById('cmdEmbedColor'); if(el) el.value = cmd.embedColor; }
    if (cmd.customCode) { const el = document.getElementById('cmdCustomCode'); if(el) el.value = cmd.customCode; }
  }, 50);
  openModal('commandModal');
}

function deleteCommand(i) {
  state.commands.splice(i, 1);
  renderCommands();
  showToast('Command removed');
}

function getPrefix() {
  return document.getElementById('botPrefix')?.value || '!';
}

// --- CODE GENERATION ---
function generateCode() {
  const file = state.currentFile;
  let content = '';

  if (file === 'index') content = generateIndexJS();
  else if (file === 'env') content = generateEnv();
  else if (file === 'package') content = generatePackageJSON();
  else if (file === 'readme') content = generateReadme();

  document.getElementById('codeContent').textContent = content;
}

function getBotName() { return document.getElementById('botName')?.value || 'MyBot'; }
function getIntents() {
  return Array.from(document.querySelectorAll('.intent-chip input:checked')).map(i => i.value);
}

function generateIndexJS() {
  const name = getBotName();
  const prefix = getPrefix();
  const useSlash = document.getElementById('useSlash')?.checked;
  const usePrefix = document.getElementById('usePrefix')?.checked;
  const useWelcome = document.getElementById('useWelcome')?.checked;
  const useLogging = document.getElementById('useLogging')?.checked;
  const intents = getIntents();

  const isRender = state.platform === 'render';

  let code = `// ${name} — Generated by BotForge
// Platform: ${isRender ? 'Render' : 'Replit'} | Add DISCORD_TOKEN to ${isRender ? 'Render Environment Variables' : 'Replit Secrets'}

require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
${isRender ? `const express = require('express');` : ''}

const client = new Client({
  intents: [
    ${intents.join(',\n    ')}
  ]
});

const PREFIX = '${prefix}';
const cooldowns = new Map();

`;

  // COMMANDS map
  if (state.commands.length > 0) {
    code += `// ===== COMMANDS =====\nconst commands = {\n`;
    state.commands.forEach(cmd => {
      code += `  ${cmd.name}: {\n`;
      code += `    name: '${cmd.name}',\n`;
      code += `    aliases: ${JSON.stringify(cmd.aliases)},\n`;
      code += `    description: '${cmd.desc || ''}',\n`;
      code += `    cooldown: ${cmd.cooldown},\n`;
      if (cmd.permission) code += `    permission: '${cmd.permission}',\n`;
      code += `    execute: async (message, args) => {\n`;
      code += generateCommandBody(cmd, 'message');
      code += `    }\n  },\n`;
    });
    code += `};\n\n`;
  }

  // READY event
  code += `// ===== READY =====\nclient.once('ready', () => {\n  console.log(\`✅ \${client.user.tag} is online!\`);\n  client.user.setActivity('${prefix}help | ${name}', { type: 0 });\n`;

  if (useSlash && state.commands.length > 0) {
    code += `\n  // Register slash commands\n  registerSlashCommands();\n`;
  }
  code += `});\n\n`;

  // PREFIX COMMANDS
  if (usePrefix && state.commands.length > 0) {
    code += `// ===== PREFIX COMMAND HANDLER =====\nclient.on('messageCreate', async (message) => {\n  if (message.author.bot) return;\n  if (!message.content.startsWith(PREFIX)) return;\n\n  const args = message.content.slice(PREFIX.length).trim().split(/\\s+/);\n  const cmdName = args.shift().toLowerCase();\n\n  const command = commands[cmdName] || Object.values(commands).find(c => c.aliases?.includes(cmdName));\n  if (!command) return;\n\n  // Cooldown check\n  if (command.cooldown > 0) {\n    const key = \`\${cmdName}-\${message.author.id}\`;\n    const now = Date.now();\n    if (cooldowns.has(key) && now - cooldowns.get(key) < command.cooldown * 1000) {\n      const remaining = ((command.cooldown * 1000 - (now - cooldowns.get(key))) / 1000).toFixed(1);\n      return message.reply(\`⏳ Please wait \${remaining}s before using this command again.\`);\n    }\n    cooldowns.set(key, now);\n  }\n\n  // Permission check\n  if (command.permission && !message.member?.permissions.has(command.permission)) {\n    return message.reply('❌ You do not have permission to use this command.');\n  }\n\n  try {\n    await command.execute(message, args);\n  } catch (err) {\n    console.error(err);\n    message.reply('❌ An error occurred while executing that command.');\n  }\n});\n\n`;
  }

  // SLASH COMMANDS
  if (useSlash && state.commands.length > 0) {
    code += `// ===== SLASH COMMAND HANDLER =====\nclient.on('interactionCreate', async (interaction) => {\n  if (!interaction.isChatInputCommand()) return;\n  const command = commands[interaction.commandName];\n  if (!command) return;\n  try {\n    // Wrap interaction for compatibility\n    const message = {\n      reply: (content) => interaction.reply(content),\n      author: interaction.user,\n      member: interaction.member,\n      guild: interaction.guild,\n      channel: interaction.channel,\n    };\n    await command.execute(message, []);\n  } catch (err) {\n    console.error(err);\n    if (!interaction.replied) interaction.reply({ content: '❌ Error executing command.', ephemeral: true });\n  }\n});\n\n`;

    code += `async function registerSlashCommands() {\n  const slashCmds = Object.values(commands).map(cmd =>\n    new SlashCommandBuilder()\n      .setName(cmd.name)\n      .setDescription(cmd.description || 'No description')\n      .toJSON()\n  );\n  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);\n  try {\n    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCmds });\n    console.log('✅ Slash commands registered!');\n  } catch (err) {\n    console.error('Failed to register slash commands:', err);\n  }\n}\n\n`;
  }

  // CUSTOM EVENTS
  const customEvents = state.events.filter(e => e.type !== 'ready');
  if (customEvents.length > 0) {
    code += `// ===== CUSTOM EVENT HANDLERS =====\n`;
    customEvents.forEach(evt => {
      code += `client.on('${evt.type}', async (`;
      if (evt.type === 'guildMemberAdd' || evt.type === 'guildMemberRemove') code += 'member';
      else if (evt.type === 'messageCreate') code += 'message';
      else if (evt.type === 'messageDelete') code += 'message';
      else if (evt.type === 'messageReactionAdd') code += 'reaction, user';
      else if (evt.type === 'guildBanAdd') code += 'ban';
      else if (evt.type === 'channelCreate') code += 'channel';
      else if (evt.type === 'voiceStateUpdate') code += 'oldState, newState';
      else if (evt.type === 'interactionCreate') code += 'interaction';
      else code += 'data';
      code += `) => {\n`;
      code += generateEventBody(evt);
      code += `});\n\n`;
    });
  }

  // WELCOME (if toggled)
  if (useWelcome && !customEvents.some(e => e.type === 'guildMemberAdd')) {
    code += `// ===== WELCOME MESSAGES =====\nclient.on('guildMemberAdd', async (member) => {\n  const channel = member.guild.systemChannel;\n  if (channel) {\n    const embed = new EmbedBuilder()\n      .setColor('#5865f2')\n      .setTitle('Welcome!')\n      .setDescription(\`Welcome to \${member.guild.name}, <@\${member.id}>! 🎉\`)\n      .setThumbnail(member.user.displayAvatarURL())\n      .setTimestamp();\n    channel.send({ embeds: [embed] });\n  }\n});\n\n`;
  }

  // LOGGING
  if (useLogging) {
    code += `// ===== LOGGING =====\nclient.on('messageDelete', async (message) => {\n  // Replace LOG_CHANNEL_ID with your log channel ID\n  const logChannel = message.guild?.channels.cache.get('LOG_CHANNEL_ID');\n  if (!logChannel || message.author?.bot) return;\n  logChannel.send(\`🗑️ Message by \${message.author?.tag} deleted in #\${message.channel.name}: \${message.content || '[embed/attachment]'}\`);\n});\n\n`;
  }

  code += `// ===== LOGIN =====\n`;
  if (isRender) {
    code += `// Keep-alive server (required for Render free tier)\nconst app = express();\napp.get('/', (req, res) => res.send('${name} is running! 🤖'));\napp.listen(process.env.PORT || 3000, () => console.log('🌐 Keep-alive server started'));\n\n`;
  }
  code += `client.login(process.env.DISCORD_TOKEN);\n`;

  return code;
}

function generateCommandBody(cmd, msgVar) {
  let body = '';
  const type = cmd.responseType;

  if (type === 'text') {
    let text = (cmd.text || 'Hello!')
      .replace(/{user}/g, `<@\${${msgVar}.author.id}>`)
      .replace(/{username}/g, `\${${msgVar}.author.username}`)
      .replace(/{server}/g, `\${${msgVar}.guild?.name || 'DM'}`);
    body = `      ${msgVar}.reply(\`${text}\`);\n`;
  } else if (type === 'embed') {
    body = `      const embed = new EmbedBuilder()\n        .setColor('${cmd.embedColor || '#5865f2'}')\n        .setTitle('${cmd.embedTitle || 'Response'}')\n        .setDescription('${cmd.embedDesc || ''}');\n      ${msgVar}.reply({ embeds: [embed] });\n`;
  } else if (type === 'ping') {
    body = `      const sent = await ${msgVar}.reply('Pinging...');\n      const latency = sent.createdTimestamp - ${msgVar}.createdTimestamp;\n      sent.edit(\`🏓 Pong! Latency: \${latency}ms | API: \${Math.round(client.ws.ping)}ms\`);\n`;
  } else if (type === 'userInfo') {
    body = `      const target = ${msgVar}.mentions?.users.first() || ${msgVar}.author;\n      const embed = new EmbedBuilder()\n        .setColor('#5865f2')\n        .setTitle(\`User Info: \${target.username}\`)\n        .addFields(\n          { name: 'ID', value: target.id, inline: true },\n          { name: 'Created', value: target.createdAt.toDateString(), inline: true }\n        )\n        .setThumbnail(target.displayAvatarURL());\n      ${msgVar}.reply({ embeds: [embed] });\n`;
  } else if (type === 'serverInfo') {
    body = `      const guild = ${msgVar}.guild;\n      if (!guild) return ${msgVar}.reply('This command only works in servers!');\n      const embed = new EmbedBuilder()\n        .setColor('#5865f2')\n        .setTitle(\`Server: \${guild.name}\`)\n        .addFields(\n          { name: 'Members', value: \`\${guild.memberCount}\`, inline: true },\n          { name: 'Owner', value: \`<@\${guild.ownerId}>\`, inline: true },\n          { name: 'Created', value: guild.createdAt.toDateString(), inline: true }\n        )\n        .setThumbnail(guild.iconURL());\n      ${msgVar}.reply({ embeds: [embed] });\n`;
  } else if (type === 'customCode') {
    const lines = (cmd.customCode || '// Custom code here').split('\n').map(l => '      ' + l).join('\n');
    body = `${lines}\n`;
  }

  return body;
}

function generateEventBody(evt) {
  let body = '';
  if (evt.action === 'sendMessage') {
    const ch = evt.channelId === 'same' || !evt.channelId ? '' : `  const ch = client.channels.cache.get('${evt.channelId}');\n  if (!ch) return;\n`;
    const target = evt.channelId === 'same' || !evt.channelId ? 'message.channel' : 'ch';
    body = `${ch}  ${target}.send(\`${evt.message || 'Event triggered!'}\`);\n`;
  } else if (evt.action === 'dmUser') {
    body = `  try { await member?.user.send(\`${evt.message || 'Hello!'}\`); } catch(e) {}\n`;
  } else if (evt.action === 'addRole') {
    body = `  try {\n    const role = member.guild.roles.cache.get('${evt.roleId}');\n    if (role) await member.roles.add(role);\n  } catch(e) { console.error(e); }\n`;
  } else if (evt.action === 'removeRole') {
    body = `  try {\n    const role = member.guild.roles.cache.get('${evt.roleId}');\n    if (role) await member.roles.remove(role);\n  } catch(e) { console.error(e); }\n`;
  } else if (evt.action === 'customCode') {
    const lines = (evt.customCode || '// Custom code').split('\n').map(l => '  ' + l).join('\n');
    body = `${lines}\n`;
  }
  return body;
}

function generateEnv() {
  const token = document.getElementById('botToken')?.value?.trim();
  return `# Discord Bot Token
# Get this from: https://discord.com/developers/applications
# Bot tab → Reset Token → copy it
DISCORD_TOKEN=${token || 'paste_your_token_here'}

# Optional: Bot Application ID (for slash commands)
# CLIENT_ID=your_client_id_here
`;
}

function generatePackageJSON() {
  const name = getBotName().toLowerCase().replace(/\s+/g, '-');
  const isRender = state.platform === 'render';
  return `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "Discord bot generated by BotForge",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "discord.js": "^14.14.1",
    "dotenv": "^16.3.1"${isRender ? `,\n    "express": "^4.18.2"` : ''}
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
`;
}

function generateReadme() {
  const name = getBotName();
  const prefix = getPrefix();
  const isRender = state.platform === 'render';
  return `# ${name}

Generated with [BotForge](https://botforge.replit.app) — No-code Discord bot creator.

## Setup

### Prerequisites
- Node.js 18+
- A Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

\`\`\`bash
npm install
\`\`\`

### Configuration

1. Copy \`.env.example\` to \`.env\` (or rename the \`.env\` file)
2. Add your bot token:
\`\`\`
DISCORD_TOKEN=your_actual_token_here
\`\`\`

### Running

\`\`\`bash
npm start
\`\`\`

## Commands

| Command | Description |
|---------|-------------|
${state.commands.map(c => `| \`${prefix}${c.name}\` | ${c.desc || 'No description'} |`).join('\n') || '| No commands added yet | |'}

## Deploy on Replit

1. Create a new **Node.js** Repl
2. Upload all files or paste the code
3. Add \`DISCORD_TOKEN\` to **Secrets** (not .env on Replit)
4. Click **Run** 🚀

To keep your bot alive 24/7, use [UptimeRobot](https://uptimerobot.com) to ping your Repl URL every 5 minutes.

## Deploy on Render

1. Push your files to a **GitHub** repository (add \`.env\` to \`.gitignore\`)
2. Create a new **Web Service** on [render.com](https://render.com) and connect the repo
3. Set **Build Command** → \`npm install\`, **Start Command** → \`node index.js\`
4. Add \`DISCORD_TOKEN\` under **Environment Variables**
5. Deploy, then use [UptimeRobot](https://uptimerobot.com) to ping your Render URL every **14 minutes** to prevent free-tier sleep

> ℹ️ The keep-alive Express server on port \`process.env.PORT\` is ${isRender ? 'already included' : 'needed if deploying to Render — switch platform to Render in BotForge to generate it automatically'}.

## Inviting the Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your app → OAuth2 → URL Generator
3. Select **bot** scope + required permissions
4. Copy the URL and open it to invite the bot
`;
}

// --- DOWNLOAD ALL ---
function downloadAll() {
  const files = {
    'index.js': generateIndexJS(),
    '.env': generateEnv(),
    'package.json': generatePackageJSON(),
    'README.md': generateReadme(),
  };

  Object.entries(files).forEach(([filename, content]) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  });

  showToast('📦 All files downloaded!');
}

function copyCode() {
  const content = document.getElementById('codeContent').textContent;
  navigator.clipboard.writeText(content).then(() => showToast('📋 Copied to clipboard!'));
}

// --- TOAST ---
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// --- LOAD EXAMPLE ---
function loadExample() {
  document.getElementById('botName').value = 'ServerBot';
  document.getElementById('botPrefix').value = '!';

  state.commands = [
    { name: 'ping', aliases: ['p'], desc: 'Check bot latency', responseType: 'ping', cooldown: 5, permission: '' },
    { name: 'hello', aliases: ['hi'], desc: 'Say hello', responseType: 'text', text: 'Hey {user}! 👋 Welcome to {server}!', cooldown: 3, permission: '' },
    { name: 'info', aliases: [], desc: 'Server information', responseType: 'serverInfo', cooldown: 10, permission: '' },
    { name: 'whois', aliases: ['user'], desc: 'Get user info', responseType: 'userInfo', cooldown: 5, permission: '' },
    { name: 'rules', aliases: [], desc: 'Show server rules', responseType: 'embed', embedTitle: '📋 Server Rules', embedDesc: '1. Be respectful\n2. No spam\n3. Follow Discord ToS\n4. Have fun!', embedColor: '#5865f2', cooldown: 0, permission: '' },
  ];

  state.events = [
    { type: 'guildMemberAdd', action: 'addRole', roleId: 'YOUR_MEMBER_ROLE_ID' },
  ];

  document.getElementById('useWelcome').checked = true;
  document.getElementById('useLogging').checked = true;

  renderCommands();
  renderEvents();
  switchTab('commands');
  showToast('✅ Example bot loaded!');
}

// --- TOKEN ---
function toggleTokenVisibility() {
  const input = document.getElementById('botToken');
  const btn = document.getElementById('tokenToggle');
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

document.getElementById('botToken')?.addEventListener('input', () => {
  if (state.currentFile === 'env') generateCode();
});

// --- INIT ---
renderEvents();
renderCommands();
updateCommandFields();
updateEventFields();
