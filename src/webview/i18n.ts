// String table for ko/en. Use t('key') everywhere user-visible.
// Adding a new string: append to BOTH dictionaries — TS will catch a missing
// key at compile time because Strings type is keyed off ko.
import { useEffect, useState } from 'preact/hooks';

const ko = {
  // header
  tab_chat: 'CHAT',
  tab_history: 'HISTORY',
  tab_knowledge: 'KNOWLEDGE',
  tab_skills: 'SKILLS',
  header_new_chat: '새 채팅',
  header_settings: '설정',
  header_more: '더보기',
  header_history_menu: '채팅 메뉴',

  // empty
  empty_title: 'hanimo와 함께 시작',
  empty_subtitle: 'AI 응답이 부정확할 수 있어요. 코드를 검증하세요.',
  suggest_1: '이 프로젝트 구조 분석해줘',
  suggest_2: '주요 함수들 찾아줘',
  suggest_3: '버그가 있을만한 곳 알려줘',

  // composer
  composer_placeholder: '무엇을 만들까요? Shift+Enter 줄바꿈, @ 로 지식/스킬 첨부, 이미지 paste/drop 가능',
  send: '전송',
  cancel: '중단',
  attach: '지식/스킬 첨부',
  insert_code: '코드 블록 삽입',
  mode_label: '모드',
  param_label: '파라미터',
  no_files: '없음',
  group_knowledge: '지식 파일',
  group_skills: '스킬',

  // bottom bar
  bb_local: '로컬',
  bb_permission: '권한',

  // settings
  settings_title: '설정',
  api_section: 'API',
  base_url: 'Base URL',
  api_key: 'API Key',
  api_key_saved: '저장됨',
  api_key_replace: '새 키로 바꾸려면 입력',
  models_section: '모델',
  model_super: 'Super (기본 모드)',
  model_dev: 'Deep Agent',
  rules_section: '사용자 지침 (~/.hanimo/rules.md)',
  rules_help: '모든 프로젝트의 모든 채팅에 자동으로 prepend 됩니다.',
  index_section: '인덱싱',
  index_help: '프로젝트의 함수/클래스를 정규식으로 빠르게 스캔합니다 (임베딩 없음, 캐시 5분).',
  language_section: '언어',
  language_label: '인터페이스 언어',
  save: '저장',
  back: '뒤로',
  reindex: '지금 다시 인덱싱',
  rules_save: '지침 저장',

  // history
  history_title: '채팅 기록',
  history_empty: '아직 채팅 기록이 없어요.',
  delete: '삭제',

  // knowledge
  knowledge_title: '프로젝트 지식 (.hanimo.md)',
  knowledge_pinned: '.hanimo.md (프로젝트)',
  knowledge_folder: '지식 폴더',
  knowledge_no_file: '파일이 아직 없습니다 — 저장 시 새로 생성됩니다.',
  knowledge_folder_hint: '활성 .md 파일들이 모든 채팅에 자동 prepend 됩니다. _name.md 처럼 _로 시작하면 비활성.',
  preview: '미리보기',
  edit: '편집',
  new_file: '새 파일',
  refresh: '새로고침',
  no_file_selected: '왼쪽에서 파일을 선택하거나 새로 만들어주세요.',
  prompt_new_md: '새 .md 파일 이름 (예: api-guide.md):',
  confirm_delete_kb: '삭제하시겠습니까?',

  // skills
  skills_title: '스킬',
  skills_hint: '스킬 인덱스(이름+설명)가 시스템 프롬프트에 노출됩니다. AI가 필요할 때 file_read 로 본문을 로드합니다.',
  skills_empty: '스킬 없음',
  skills_intro: '스킬 = 자주 쓰는 워크플로우. AI가 필요할 때 자동으로 참고합니다.',
  prompt_new_skill: '새 스킬 이름 (예: code-review.md):',
  new_skill: '새 스킬',

  // permissions
  perms_title: '권한 정책',
  perms_hint: '~/.hanimo/permissions.yaml — TUI 와 공유. 변경 즉시 적용.',
  perms_profiles: '프로필',
  perms_per_tool: '도구별',
  perms_shell: '셸 명령 차단 패턴 (정규식)',
  perms_shell_hint: '한 줄에 하나씩. shell_exec 호출 시 명령어가 이 패턴 중 하나에 매치하면 거부됩니다.',
  reset_default: '기본값으로 초기화',
  allow: '허용',
  ask: '확인',
  deny: '차단',
  group_read: '읽기',
  group_git: 'Git',
  group_write: '쓰기',
  group_exec: '실행',

  // confirm modal
  confirm_msg: '실행을 허용하시겠습니까?',
};

const en: typeof ko = {
  tab_chat: 'CHAT',
  tab_history: 'HISTORY',
  tab_knowledge: 'KNOWLEDGE',
  tab_skills: 'SKILLS',
  header_new_chat: 'New chat',
  header_settings: 'Settings',
  header_more: 'More',
  header_history_menu: 'Chat menu',

  empty_title: 'Get started with HANIMO',
  empty_subtitle: 'AI responses may be inaccurate. Verify the code.',
  suggest_1: 'Analyze this project structure',
  suggest_2: 'Find the main functions',
  suggest_3: 'Where might bugs hide',

  composer_placeholder: 'Describe what to build. Shift+Enter to break, @ to attach knowledge/skill, paste/drop images.',
  send: 'Send',
  cancel: 'Cancel',
  attach: 'Attach knowledge/skill',
  insert_code: 'Insert code block',
  mode_label: 'Mode',
  param_label: 'Parameters',
  no_files: 'None',
  group_knowledge: 'Knowledge',
  group_skills: 'Skills',

  bb_local: 'Local',
  bb_permission: 'Permissions',

  settings_title: 'Settings',
  api_section: 'API',
  base_url: 'Base URL',
  api_key: 'API key',
  api_key_saved: 'saved',
  api_key_replace: 'Type to replace',
  models_section: 'Models',
  model_super: 'Super (default mode)',
  model_dev: 'Deep Agent',
  rules_section: 'User rules (~/.hanimo/rules.md)',
  rules_help: 'Automatically prepended to every chat across every project.',
  index_section: 'Indexing',
  index_help: 'Regex-based scan of functions/classes (no embeddings, 5-min cache).',
  language_section: 'Language',
  language_label: 'Interface language',
  save: 'Save',
  back: 'Back',
  reindex: 'Reindex now',
  rules_save: 'Save rules',

  history_title: 'Chat history',
  history_empty: 'No chats yet.',
  delete: 'Delete',

  knowledge_title: 'Project knowledge (.hanimo.md)',
  knowledge_pinned: '.hanimo.md (project)',
  knowledge_folder: 'Knowledge folder',
  knowledge_no_file: 'File does not exist yet — will be created on save.',
  knowledge_folder_hint: 'Active .md files are auto-prepended to every chat. Files starting with _ are disabled.',
  preview: 'Preview',
  edit: 'Edit',
  new_file: 'New file',
  refresh: 'Refresh',
  no_file_selected: 'Select a file on the left or create a new one.',
  prompt_new_md: 'New .md filename (e.g. api-guide.md):',
  confirm_delete_kb: 'Delete?',

  skills_title: 'Skills',
  skills_hint: 'Skill index (name + description) is shown in the system prompt. The AI loads the body via file_read when relevant.',
  skills_empty: 'No skills',
  skills_intro: 'Skills = recurring workflows. The AI references them on demand.',
  prompt_new_skill: 'New skill name (e.g. code-review.md):',
  new_skill: 'New skill',

  perms_title: 'Permissions',
  perms_hint: '~/.hanimo/permissions.yaml — shared with the TUI. Changes apply immediately.',
  perms_profiles: 'Profiles',
  perms_per_tool: 'Per tool',
  perms_shell: 'Shell command deny patterns (regex)',
  perms_shell_hint: 'One per line. Matching shell_exec invocations are rejected.',
  reset_default: 'Reset to defaults',
  allow: 'Allow',
  ask: 'Ask',
  deny: 'Deny',
  group_read: 'Read',
  group_git: 'Git',
  group_write: 'Write',
  group_exec: 'Exec',

  confirm_msg: 'Allow tool execution?',
};

export type StringKey = keyof typeof ko;
const dicts: Record<string, typeof ko> = { ko, en };

let current: 'ko' | 'en' = 'ko';
const listeners = new Set<() => void>();

export function setLocale(loc: 'ko' | 'en') {
  if (current === loc) return;
  current = loc;
  try { localStorage.setItem('hanimo-locale', loc); } catch { /* sandboxed */ }
  listeners.forEach((fn) => fn());
}

export function getLocale(): 'ko' | 'en' { return current; }

// Read once from localStorage at module load.
try {
  const saved = localStorage.getItem('hanimo-locale');
  if (saved === 'ko' || saved === 'en') current = saved;
} catch { /* ignore */ }

export function t(key: StringKey): string {
  return dicts[current][key] ?? dicts.ko[key];
}

/** React hook — re-renders the calling component when locale changes. */
export function useLocale(): 'ko' | 'en' {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return current;
}
