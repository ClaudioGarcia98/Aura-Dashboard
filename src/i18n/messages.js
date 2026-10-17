// English source key | Portuguese (Portugal) | Portuguese (Brazil) | Spanish | French | German | Japanese | Korean.
// Keep every row complete. Placeholders are interpolated as text, never HTML.
const rows = `
New priority…|Nova prioridade…|Nova prioridade…|Nueva prioridad…|Nouvelle priorité…|Neue Priorität…|新しい優先タスク…|새 우선 할 일…
Time zone|Fuso horário|Fuso horário|Zona horaria|Fuseau horaire|Zeitzone|タイムゾーン|시간대
Automatic — device time zone|Automático — fuso horário do dispositivo|Automático — fuso horário do dispositivo|Automático — zona horaria del dispositivo|Automatique — fuseau de l’appareil|Automatisch — Gerätezeitzone|自動 — デバイスのタイムゾーン|자동 — 기기 시간대
Clock, date and anime schedule use this time zone. No location permission needed.|O relógio, a data e o calendário de anime usam este fuso horário. Não é necessária permissão de localização.|O relógio, a data e o calendário de anime usam este fuso horário. Não é necessária permissão de localização.|El reloj, la fecha y el calendario de anime usan esta zona horaria. No se necesita permiso de ubicación.|L’horloge, la date et le programme anime utilisent ce fuseau. Aucune autorisation de localisation n’est nécessaire.|Uhr, Datum und Anime-Zeitplan verwenden diese Zeitzone. Keine Standortberechtigung nötig.|時計、日付、アニメの予定にこのタイムゾーンを使用します。位置情報の許可は不要です。|시계, 날짜 및 애니메이션 편성표에 이 시간대를 사용합니다. 위치 권한이 필요하지 않습니다.
Also show Japan time (JST) for anime|Mostrar também a hora do Japão (JST) nos animes|Mostrar também a hora do Japão (JST) nos animes|Mostrar también la hora de Japón (JST) para anime|Afficher aussi l’heure du Japon (JST) pour les animes|Bei Anime auch japanische Zeit (JST) anzeigen|アニメに日本標準時（JST）も表示|애니메이션에 일본 표준시(JST)도 표시
Schedule time zone: {zone}|Fuso horário do calendário: {zone}|Fuso horário do calendário: {zone}|Zona horaria del calendario: {zone}|Fuseau du programme : {zone}|Zeitzone des Zeitplans: {zone}|予定のタイムゾーン：{zone}|편성표 시간대: {zone}
Times use {zone}. Japan time (JST) is an optional reference in Settings.|As horas seguem {zone}. A hora do Japão (JST) pode ser ativada nas Definições.|Os horários seguem {zone}. A hora do Japão (JST) pode ser ativada nas Configurações.|Los horarios usan {zone}. Puedes activar la hora de Japón (JST) en Ajustes.|Les horaires utilisent {zone}. L’heure du Japon (JST) peut être activée dans les paramètres.|Die Zeiten verwenden {zone}. Japanische Zeit (JST) kann in den Einstellungen aktiviert werden.|時刻は{zone}で表示します。設定で日本標準時（JST）も表示できます。|시간은 {zone} 기준입니다. 설정에서 일본 표준시(JST)도 표시할 수 있습니다.
Episodes are grouped by the selected time zone’s calendar day.|Os episódios são agrupados pelo dia do fuso horário selecionado.|Os episódios são agrupados pelo dia do fuso horário selecionado.|Los episodios se agrupan por el día de la zona horaria seleccionada.|Les épisodes sont regroupés selon le jour du fuseau choisi.|Folgen werden nach dem Kalendertag der gewählten Zeitzone gruppiert.|エピソードは選択したタイムゾーンの日付でまとめられます。|에피소드는 선택한 시간대의 날짜별로 표시됩니다.
Synopsis available in English|Sinopse disponível em inglês|Sinopse disponível em inglês|Sinopsis disponible en inglés|Synopsis disponible en anglais|Beschreibung auf Englisch verfügbar|あらすじは英語で表示されます|줄거리는 영어로 제공됩니다
Action|Ação|Ação|Acción|Action|Action|アクション|액션
Adventure|Aventura|Aventura|Aventura|Aventure|Abenteuer|冒険|모험
Comedy|Comédia|Comédia|Comedia|Comédie|Komödie|コメディ|코미디
Drama|Drama|Drama|Drama|Drame|Drama|ドラマ|드라마
Fantasy|Fantasia|Fantasia|Fantasía|Fantastique|Fantasy|ファンタジー|판타지
Horror|Terror|Terror|Terror|Horreur|Horror|ホラー|공포
Romance|Romance|Romance|Romance|Romance|Romantik|恋愛|로맨스
Sci-Fi|Ficção científica|Ficção científica|Ciencia ficción|Science-fiction|Science-Fiction|SF|공상과학
Slice of Life|Quotidiano|Cotidiano|Vida cotidiana|Tranche de vie|Alltagsleben|日常|일상
Sports|Desporto|Esportes|Deportes|Sport|Sport|スポーツ|스포츠
Supernatural|Sobrenatural|Sobrenatural|Sobrenatural|Surnaturel|Übernatürliches|超自然|초자연
Mystery|Mistério|Mistério|Misterio|Mystère|Mystery|ミステリー|미스터리
Thriller|Suspense|Suspense|Suspenso|Thriller|Thriller|スリラー|스릴러
Mecha|Mecha|Mecha|Mecha|Mecha|Mecha|メカ|메카
Psychological|Psicológico|Psicológico|Psicológico|Psychologique|Psychologisch|心理|심리
Ecchi|Ecchi|Ecchi|Ecchi|Ecchi|Ecchi|エッチ|에치
Mahou Shoujo|Raparigas mágicas|Garotas mágicas|Chicas mágicas|Magical girl|Magical Girl|魔法少女|마법소녀
Guest|Visitante|Visitante|Invitado|Invité|Gast|ゲスト|게스트
Stations|Estações|Estações|Emisoras|Stations|Sender|ステーション|방송국
Lofi Music|Música Lofi|Música Lofi|Música Lofi|Musique Lofi|Lofi-Musik|Lofiミュージック|로파이 음악
Anime Trailer Preview|Pré-visualização do trailer|Prévia do trailer|Vista previa del tráiler|Aperçu de la bande-annonce|Anime-Trailervorschau|アニメ予告編のプレビュー|애니메이션 예고편 미리보기
Success|Sucesso|Sucesso|Éxito|Réussi|Erfolgreich|完了|완료
No speed dials added yet.|Ainda não há atalhos.|Nenhum atalho adicionado ainda.|Todavía no hay accesos rápidos.|Aucun raccourci pour le moment.|Noch keine Schnellzugriffe hinzugefügt.|ショートカットはまだありません。|아직 바로가기가 없습니다.
Paste URL here...|Cola o URL aqui…|Cole a URL aqui…|Pega la URL aquí…|Collez l’URL ici…|URL hier einfügen…|URLを貼り付け…|URL을 붙여 넣으세요…
Playback did not start. Try again or choose another station.|A reprodução não iniciou. Tenta novamente ou escolhe outra estação.|A reprodução não começou. Tente novamente ou escolha outra estação.|La reproducción no comenzó. Reintenta o elige otra emisora.|La lecture n’a pas démarré. Réessayez ou choisissez une autre station.|Wiedergabe nicht gestartet. Versuche es erneut oder wähle einen anderen Sender.|再生が始まりませんでした。再試行するか、別のステーションを選択してください。|재생이 시작되지 않았습니다. 다시 시도하거나 다른 방송국을 선택하세요.
Your browser blocked playback. Press Play to start this station.|O navegador bloqueou a reprodução. Carrega em Reproduzir para iniciar.|O navegador bloqueou a reprodução. Pressione Reproduzir para iniciar.|El navegador bloqueó la reproducción. Pulsa Reproducir para iniciar.|Le navigateur a bloqué la lecture. Appuyez sur Lire pour démarrer.|Dein Browser hat die Wiedergabe blockiert. Drücke auf Abspielen.|ブラウザーが再生をブロックしました。再生ボタンを押してください。|브라우저가 재생을 차단했습니다. 재생 버튼을 누르세요.
This station is unavailable. Try another station.|Esta estação está indisponível. Experimenta outra.|Esta estação está indisponível. Tente outra.|Esta emisora no está disponible. Prueba otra.|Cette station est indisponible. Essayez-en une autre.|Dieser Sender ist nicht verfügbar. Wähle einen anderen.|このステーションは利用できません。別のものをお試しください。|이 방송국을 사용할 수 없습니다. 다른 방송국을 선택하세요.
Something went wrong. Please try again.|Ocorreu um erro. Tenta novamente.|Ocorreu um erro. Tente novamente.|Se produjo un error. Inténtalo de nuevo.|Une erreur s’est produite. Réessayez.|Ein Fehler ist aufgetreten. Versuche es erneut.|エラーが発生しました。もう一度お試しください。|오류가 발생했습니다. 다시 시도하세요.
Invalid backup format.|Formato de cópia de segurança inválido.|Formato de backup inválido.|Formato de copia de seguridad no válido.|Format de sauvegarde invalide.|Ungültiges Sicherungsformat.|バックアップの形式が無効です。|잘못된 백업 형식입니다.
Unsupported settings version.|Versão de definições não suportada.|Versão de configurações não compatível.|Versión de ajustes no compatible.|Version des paramètres non prise en charge.|Nicht unterstützte Einstellungsversion.|対応していない設定バージョンです。|지원하지 않는 설정 버전입니다.
Invalid legacy settings.|Definições antigas inválidas.|Configurações antigas inválidas.|Ajustes antiguos no válidos.|Anciens paramètres invalides.|Ungültige ältere Einstellungen.|旧設定の形式が無効です。|잘못된 이전 설정입니다.
Settings must be an object.|O formato das definições é inválido.|O formato das configurações é inválido.|El formato de los ajustes no es válido.|Le format des paramètres est invalide.|Ungültiges Einstellungsformat.|設定の形式が無効です。|설정 형식이 잘못되었습니다.
The backup contains invalid or unsupported settings.|A cópia contém definições inválidas ou não suportadas.|O backup contém configurações inválidas ou não compatíveis.|La copia contiene ajustes no válidos o no compatibles.|La sauvegarde contient des paramètres invalides ou non pris en charge.|Die Sicherung enthält ungültige oder nicht unterstützte Einstellungen.|バックアップに無効または未対応の設定が含まれています。|백업에 잘못되었거나 지원하지 않는 설정이 있습니다.
This is not a supported Aura appearance preset.|Este não é um preset de aparência Aura suportado.|Este não é um preset de aparência Aura compatível.|Este preset de apariencia de Aura no es compatible.|Ce préréglage d’apparence Aura n’est pas pris en charge.|Diese Aura-Darstellungsvorlage wird nicht unterstützt.|対応していないAura外観プリセットです。|지원하지 않는 Aura 모양 프리셋입니다.
Choose a valid Aura preset JSON file.|Escolhe um ficheiro JSON de preset Aura válido.|Escolha um arquivo JSON de preset Aura válido.|Elige un archivo JSON de preset Aura válido.|Choisissez un fichier JSON de préréglage Aura valide.|Wähle eine gültige Aura-Vorlage als JSON-Datei.|有効なAuraプリセットのJSONファイルを選択してください。|올바른 Aura 프리셋 JSON 파일을 선택하세요.
Preset contains an unknown theme or font.|O preset contém um tema ou tipo de letra desconhecido.|O preset contém um tema ou fonte desconhecidos.|El preset contiene un tema o fuente desconocidos.|Le préréglage contient un thème ou une police inconnus.|Die Vorlage enthält ein unbekanntes Design oder eine unbekannte Schrift.|不明なテーマまたはフォントが含まれています。|프리셋에 알 수 없는 테마 또는 글꼴이 있습니다.
Preset contains an invalid station list.|A lista de estações do preset é inválida.|A lista de estações do preset é inválida.|La lista de emisoras del preset no es válida.|La liste des stations est invalide.|Die Senderliste der Vorlage ist ungültig.|ステーション一覧が無効です。|프리셋의 방송국 목록이 잘못되었습니다.
Preset contains an invalid or duplicate station.|O preset contém uma estação inválida ou repetida.|O preset contém uma estação inválida ou duplicada.|El preset contiene una emisora no válida o duplicada.|Le préréglage contient une station invalide ou en double.|Die Vorlage enthält einen ungültigen oder doppelten Sender.|無効または重複したステーションが含まれています。|프리셋에 잘못되었거나 중복된 방송국이 있습니다.
The selected station is missing from this preset.|A estação selecionada não consta deste preset.|A estação selecionada não está neste preset.|Falta la emisora seleccionada en este preset.|La station sélectionnée manque dans ce préréglage.|Der gewählte Sender fehlt in dieser Vorlage.|選択したステーションがプリセットにありません。|선택한 방송국이 프리셋에 없습니다.
Preset contains an unsupported wallpaper.|O preset contém um fundo não suportado.|O preset contém um fundo não compatível.|El preset contiene un fondo no compatible.|Le fond du préréglage n’est pas pris en charge.|Die Vorlage enthält einen nicht unterstützten Hintergrund.|対応していない背景が含まれています。|프리셋에 지원하지 않는 배경이 있습니다.
Preset wallpaper is invalid.|O fundo do preset é inválido.|O fundo do preset é inválido.|El fondo del preset no es válido.|Le fond du préréglage est invalide.|Der Hintergrund der Vorlage ist ungültig.|プリセットの背景が無効です。|프리셋 배경이 잘못되었습니다.
Preset wallpaper must be an image or video file.|O fundo deve ser uma imagem ou um vídeo.|O fundo deve ser uma imagem ou um vídeo.|El fondo debe ser una imagen o un vídeo.|Le fond doit être une image ou une vidéo.|Der Hintergrund muss ein Bild oder Video sein.|背景には画像または動画ファイルを指定してください。|프리셋 배경은 이미지 또는 동영상 파일이어야 합니다.
Wallpaper exceeds the 50 MB limit.|O fundo excede o limite de 50 MB.|O fundo excede o limite de 50 MB.|El fondo supera el límite de 50 MB.|Le fond dépasse la limite de 50 Mo.|Der Hintergrund überschreitet das Limit von 50 MB.|背景が上限の50 MBを超えています。|배경이 50MB 제한을 초과합니다.
Could not read your wallpaper. Export with “Include wallpaper” switched off.|Não foi possível ler o fundo. Exporta sem a opção «Incluir fundo».|Não foi possível ler o fundo. Exporte com a opção “Incluir fundo” desativada.|No se pudo leer el fondo. Exporta con «Incluir fondo» desactivado.|Impossible de lire le fond. Exportez sans l’option « Inclure le fond ».|Hintergrund konnte nicht gelesen werden. Exportiere ohne „Hintergrund einschließen“.|背景を読み取れませんでした。「背景を含める」をオフにして書き出してください。|배경을 읽을 수 없습니다. '배경 포함'을 끄고 내보내세요.
Could not save this preset. Your current setup has been kept.|Não foi possível guardar o preset. O ambiente atual foi mantido.|Não foi possível salvar o preset. A configuração atual foi mantida.|No se pudo guardar el preset. Se ha conservado tu configuración actual.|Impossible d’enregistrer le préréglage. Votre configuration actuelle a été conservée.|Vorlage konnte nicht gespeichert werden. Deine aktuelle Einrichtung wurde beibehalten.|プリセットを保存できませんでした。現在の設定は保持されています。|프리셋을 저장할 수 없습니다. 현재 설정이 유지되었습니다.
Language|Idioma|Idioma|Idioma|Langue|Sprache|言語|언어
Automatic (browser language)|Automático (idioma do navegador)|Automático (idioma do navegador)|Automático (idioma del navegador)|Automatique (langue du navigateur)|Automatisch (Browsersprache)|自動（ブラウザーの言語）|자동 (브라우저 언어)
Choose your language. Dates and numbers follow this choice.|Escolhe o idioma. As datas e os números seguem esta opção.|Escolha o idioma. Datas e números seguem esta opção.|Elige tu idioma. Las fechas y los números siguen esta opción.|Choisissez votre langue. Les dates et les nombres suivent ce choix.|Wähle deine Sprache. Datum und Zahlen folgen dieser Auswahl.|言語を選択すると、日付と数値の表示も切り替わります。|언어를 선택하면 날짜와 숫자 표시도 변경됩니다.
Home|Início|Início|Inicio|Accueil|Start|ホーム|홈
Anime|Anime|Anime|Anime|Anime|Anime|アニメ|애니메이션
Lofi|Lofi|Lofi|Lofi|Lofi|Lofi|Lofi|로파이
Settings|Definições|Configurações|Ajustes|Paramètres|Einstellungen|設定|설정
Primary|Navegação principal|Navegação principal|Navegación principal|Navigation principale|Hauptnavigation|メインナビゲーション|기본 탐색
Aura Settings|Definições do Aura|Configurações do Aura|Ajustes de Aura|Paramètres d’Aura|Aura-Einstellungen|Auraの設定|Aura 설정
Toggle Settings Panel|Abrir ou fechar definições|Abrir ou fechar configurações|Abrir o cerrar ajustes|Ouvrir ou fermer les paramètres|Einstellungen öffnen oder schließen|設定パネルを開閉|설정 패널 열기 또는 닫기
Close settings|Fechar definições|Fechar configurações|Cerrar ajustes|Fermer les paramètres|Einstellungen schließen|設定を閉じる|설정 닫기
Profile|Perfil|Perfil|Perfil|Profil|Profil|プロフィール|프로필
Display Name|Nome a apresentar|Nome de exibição|Nombre visible|Nom affiché|Anzeigename|表示名|표시 이름
Your name|O teu nome|Seu nome|Tu nombre|Votre nom|Dein Name|名前|이름
MyAnimeList Username|Nome de utilizador MyAnimeList|Nome de usuário MyAnimeList|Usuario de MyAnimeList|Identifiant MyAnimeList|MyAnimeList-Benutzername|MyAnimeListユーザー名|MyAnimeList 사용자 이름
Your MAL username|O teu nome de utilizador MAL|Seu nome de usuário MAL|Tu usuario de MAL|Votre identifiant MAL|Dein MAL-Benutzername|MALユーザー名|MAL 사용자 이름
Dashboard Layout|Disposição do painel|Layout do painel|Diseño del panel|Disposition du tableau de bord|Dashboard-Layout|ダッシュボードの配置|대시보드 레이아웃
Weather Widget|Meteorologia|Clima|Tiempo|Météo|Wetter|天気ウィジェット|날씨 위젯
Quote of the Day|Frase do dia|Frase do dia|Frase del día|Citation du jour|Zitat des Tages|今日の名言|오늘의 명언
Search Box|Caixa de pesquisa|Caixa de pesquisa|Buscador|Barre de recherche|Suchfeld|検索ボックス|검색창
Speed Dials|Atalhos|Atalhos|Accesos rápidos|Raccourcis|Schnellzugriffe|ショートカット|바로가기
Today's Launch (Top 5)|Estreias de hoje (Top 5)|Lançamentos de hoje (Top 5)|Estrenos de hoy (Top 5)|Sorties du jour (Top 5)|Heutige Folgen (Top 5)|今日の放送（上位5件）|오늘의 방영 (상위 5개)
Anime Sidebar|Painel de anime|Painel de anime|Panel de anime|Panneau anime|Anime-Seitenleiste|アニメサイドバー|애니메이션 사이드바
Lofi Player|Leitor Lofi|Player Lofi|Reproductor Lofi|Lecteur Lofi|Lofi-Player|Lofiプレーヤー|로파이 플레이어
Focus Timer & Tasks|Temporizador e tarefas|Temporizador e tarefas|Temporizador y tareas|Minuteur et tâches|Fokus-Timer und Aufgaben|集中タイマーとタスク|집중 타이머 및 할 일
Hide|Ocultar|Ocultar|Ocultar|Masquer|Ausblenden|非表示|숨기기
Show|Mostrar|Mostrar|Mostrar|Afficher|Anzeigen|表示|표시
Weather|Meteorologia|Clima|Tiempo|Météo|Wetter|天気|날씨
Your City|A tua cidade|Sua cidade|Tu ciudad|Votre ville|Deine Stadt|都市|도시
e.g. London|ex.: Lisboa|ex.: São Paulo|p. ej., Madrid|ex. Paris|z. B. Berlin|例：東京|예: 서울
Searching...|A pesquisar…|Pesquisando…|Buscando…|Recherche…|Suche…|検索中…|검색 중…
This is only used when your browser's GPS location is unavailable or denied.|Só é utilizado quando a localização GPS está indisponível ou não é permitida.|Usado apenas quando a localização GPS está indisponível ou não é permitida.|Solo se usa si la ubicación GPS no está disponible o se ha denegado.|Utilisé uniquement si la localisation GPS est indisponible ou refusée.|Wird nur verwendet, wenn der GPS-Standort nicht verfügbar oder nicht erlaubt ist.|GPSの位置情報が取得できない場合や許可されていない場合にのみ使用します。|GPS 위치를 사용할 수 없거나 권한이 거부된 경우에만 사용합니다.
Temperature Unit|Unidade de temperatura|Unidade de temperatura|Unidad de temperatura|Unité de température|Temperatureinheit|温度の単位|온도 단위
Celsius (°C)|Celsius (°C)|Celsius (°C)|Celsius (°C)|Celsius (°C)|Celsius (°C)|摂氏（°C）|섭씨 (°C)
Fahrenheit (°F)|Fahrenheit (°F)|Fahrenheit (°F)|Fahrenheit (°F)|Fahrenheit (°F)|Fahrenheit (°F)|華氏（°F）|화씨 (°F)
Theme|Tema|Tema|Tema|Thème|Design|テーマ|테마
Themes|Temas|Temas|Temas|Thèmes|Designs|テーマ|테마
Font|Tipo de letra|Fonte|Fuente|Police|Schriftart|フォント|글꼴
Default|Predefinido|Padrão|Predeterminado|Par défaut|Standard|標準|기본값
Clock Style|Estilo do relógio|Estilo do relógio|Estilo del reloj|Style d’horloge|Uhrstil|時計のスタイル|시계 스타일
Digital|Digital|Digital|Digital|Numérique|Digital|デジタル|디지털
Analog|Analógico|Analógico|Analógico|Analogique|Analog|アナログ|아날로그
Both|Ambos|Ambos|Ambos|Les deux|Beides|両方|둘 다
Clock Format|Formato da hora|Formato de hora|Formato de hora|Format de l’heure|Zeitformat|時刻の形式|시간 형식
12-Hour|12 horas|12 horas|12 horas|12 heures|12 Stunden|12時間|12시간
24-Hour|24 horas|24 horas|24 horas|24 heures|24 Stunden|24時間|24시간
Media Volume|Volume multimédia|Volume de mídia|Volumen multimedia|Volume multimédia|Medienlautstärke|メディア音量|미디어 음량
Mute media volume|Silenciar multimédia|Silenciar mídia|Silenciar multimedia|Couper le son multimédia|Medien stummschalten|メディアをミュート|미디어 음소거
Unmute media volume|Ativar som multimédia|Ativar som da mídia|Activar sonido multimedia|Rétablir le son multimédia|Medienton einschalten|メディアのミュートを解除|미디어 음소거 해제
Mute|Silenciar|Silenciar|Silenciar|Couper le son|Stummschalten|ミュート|음소거
Unmute|Ativar som|Ativar som|Activar sonido|Rétablir le son|Ton einschalten|ミュート解除|음소거 해제
Background|Fundo|Plano de fundo|Fondo|Arrière-plan|Hintergrund|背景|배경
Change GIF…|Alterar fundo…|Alterar fundo…|Cambiar fondo…|Changer le fond…|Hintergrund ändern…|背景を変更…|배경 변경…
Choose local GIF…|Escolher fundo local…|Escolher fundo local…|Elegir fondo local…|Choisir un fond local…|Lokalen Hintergrund wählen…|背景ファイルを選択…|배경 파일 선택…
Default (animated_gif.mp4)|Predefinido (animated_gif.mp4)|Padrão (animated_gif.mp4)|Predeterminado (animated_gif.mp4)|Par défaut (animated_gif.mp4)|Standard (animated_gif.mp4)|標準（animated_gif.mp4）|기본값 (animated_gif.mp4)
Restore default animation|Repor animação predefinida|Restaurar animação padrão|Restaurar animación predeterminada|Rétablir l’animation par défaut|Standardanimation wiederherstellen|標準のアニメーションに戻す|기본 애니메이션 복원
↺ Restore|↺ Repor|↺ Restaurar|↺ Restaurar|↺ Rétablir|↺ Wiederherstellen|↺ 元に戻す|↺ 복원
File exceeds 50MB maximum limit|O ficheiro excede o limite de 50 MB|O arquivo excede o limite de 50 MB|El archivo supera el límite de 50 MB|Le fichier dépasse la limite de 50 Mo|Die Datei überschreitet das Limit von 50 MB|ファイルが上限の50 MBを超えています|파일이 50MB 제한을 초과합니다
Unsupported file type. Please choose an image or MP4 video.|Formato não suportado. Escolhe uma imagem ou um vídeo MP4.|Formato não compatível. Escolha uma imagem ou um vídeo MP4.|Formato no compatible. Elige una imagen o un vídeo MP4.|Format non pris en charge. Choisissez une image ou une vidéo MP4.|Dateityp nicht unterstützt. Wähle ein Bild oder MP4-Video.|対応していない形式です。画像またはMP4動画を選択してください。|지원하지 않는 형식입니다. 이미지 또는 MP4 동영상을 선택하세요.
Failed to store media in local database|Não foi possível guardar o ficheiro localmente|Não foi possível salvar o arquivo localmente|No se pudo guardar el archivo localmente|Impossible d’enregistrer le fichier localement|Datei konnte nicht lokal gespeichert werden|ファイルをローカルに保存できませんでした|파일을 로컬에 저장할 수 없습니다
Could not remove the saved background. Please try again.|Não foi possível remover o fundo guardado. Tenta novamente.|Não foi possível remover o fundo salvo. Tente novamente.|No se pudo eliminar el fondo guardado. Inténtalo de nuevo.|Impossible de supprimer le fond enregistré. Réessayez.|Gespeicherter Hintergrund konnte nicht entfernt werden. Versuche es erneut.|保存した背景を削除できませんでした。もう一度お試しください。|저장된 배경을 삭제할 수 없습니다. 다시 시도하세요.
Lofi Stations|Estações Lofi|Estações Lofi|Emisoras Lofi|Stations Lofi|Lofi-Sender|Lofiステーション|로파이 방송국
YouTube ID or URL|ID ou URL do YouTube|ID ou URL do YouTube|ID o URL de YouTube|Identifiant ou URL YouTube|YouTube-ID oder URL|YouTubeのIDまたはURL|YouTube ID 또는 URL
Name (optional)|Nome (opcional)|Nome (opcional)|Nombre (opcional)|Nom (facultatif)|Name (optional)|名前（任意）|이름 (선택 사항)
Name|Nome|Nome|Nombre|Nom|Name|名前|이름
Add|Adicionar|Adicionar|Añadir|Ajouter|Hinzufügen|追加|추가
Save|Guardar|Salvar|Guardar|Enregistrer|Speichern|保存|저장
Edit|Editar|Editar|Editar|Modifier|Bearbeiten|編集|편집
Delete|Eliminar|Excluir|Eliminar|Supprimer|Löschen|削除|삭제
Remove|Remover|Remover|Quitar|Retirer|Entfernen|削除|삭제
Cancel|Cancelar|Cancelar|Cancelar|Annuler|Abbrechen|キャンセル|취소
Drag to reorder|Arrasta para reordenar|Arraste para reordenar|Arrastra para reordenar|Glisser pour réorganiser|Zum Sortieren ziehen|ドラッグして並べ替え|드래그하여 순서 변경
Move {name} up|Mover {name} para cima|Mover {name} para cima|Subir {name}|Monter {name}|{name} nach oben verschieben|{name}を上に移動|{name} 위로 이동
Move {name} down|Mover {name} para baixo|Mover {name} para baixo|Bajar {name}|Descendre {name}|{name} nach unten verschieben|{name}を下に移動|{name} 아래로 이동
Add radio station|Adicionar estação de rádio|Adicionar estação de rádio|Añadir emisora|Ajouter une station|Radiosender hinzufügen|ステーションを追加|방송국 추가
Open on YouTube|Abrir no YouTube|Abrir no YouTube|Abrir en YouTube|Ouvrir sur YouTube|Auf YouTube öffnen|YouTubeで開く|YouTube에서 열기
Edit station|Editar estação|Editar estação|Editar emisora|Modifier la station|Sender bearbeiten|ステーションを編集|방송국 편집
Delete station|Eliminar estação|Excluir estação|Eliminar emisora|Supprimer la station|Sender löschen|ステーションを削除|방송국 삭제
Add speed dial|Adicionar atalho|Adicionar atalho|Añadir acceso rápido|Ajouter un raccourci|Schnellzugriff hinzufügen|ショートカットを追加|바로가기 추가
Edit speed dial|Editar atalho|Editar atalho|Editar acceso rápido|Modifier le raccourci|Schnellzugriff bearbeiten|ショートカットを編集|바로가기 편집
Delete speed dial|Eliminar atalho|Excluir atalho|Eliminar acceso rápido|Supprimer le raccourci|Schnellzugriff löschen|ショートカットを削除|바로가기 삭제
Quick Links|Ligações rápidas|Links rápidos|Enlaces rápidos|Liens rapides|Schnelllinks|クイックリンク|빠른 링크
Add Speed Dial|Adicionar atalho|Adicionar atalho|Añadir acceso rápido|Ajouter un raccourci|Schnellzugriff hinzufügen|ショートカットを追加|바로가기 추가
Remove Speed Dial|Remover atalho|Remover atalho|Eliminar acceso rápido|Supprimer le raccourci|Schnellzugriff entfernen|ショートカットを削除|바로가기 삭제
Add to Speed Dial|Adicionar aos atalhos|Adicionar aos atalhos|Añadir a accesos rápidos|Ajouter aux raccourcis|Zu Schnellzugriffen hinzufügen|ショートカットに追加|바로가기에 추가
Let's search something|Vamos pesquisar|Vamos pesquisar|Vamos a buscar algo|Lancez une recherche|Lass uns etwas suchen|検索してみましょう|검색해 보세요
Search|Pesquisar|Pesquisar|Buscar|Rechercher|Suchen|検索|검색
Recent|Recentes|Recentes|Recientes|Récentes|Zuletzt gesucht|履歴|최근 검색
Remove {query} from history|Remover {query} do histórico|Remover {query} do histórico|Eliminar {query} del historial|Supprimer {query} de l’historique|{query} aus dem Verlauf entfernen|履歴から{query}を削除|기록에서 {query} 삭제
Privacy & Motion|Privacidade e movimento|Privacidade e movimento|Privacidad y movimiento|Confidentialité et animations|Datenschutz und Bewegung|プライバシーと動き|개인정보 및 모션
Online search suggestions|Sugestões de pesquisa online|Sugestões de pesquisa on-line|Sugerencias de búsqueda en línea|Suggestions de recherche en ligne|Online-Suchvorschläge|オンライン検索候補|온라인 검색 제안
Send typed search text to Google for suggestions. Your browser may block these requests.|Envia o texto da pesquisa para o Google para obter sugestões. O navegador pode bloquear estes pedidos.|Envia o texto da pesquisa ao Google para obter sugestões. O navegador pode bloquear essas solicitações.|Envía el texto de búsqueda a Google para obtener sugerencias. El navegador puede bloquear estas solicitudes.|Envoie le texte saisi à Google pour obtenir des suggestions. Le navigateur peut bloquer ces requêtes.|Sendet Suchtext für Vorschläge an Google. Dein Browser kann diese Anfragen blockieren.|入力した検索語をGoogleに送信して候補を取得します。ブラウザーが通信をブロックする場合があります。|검색 제안을 위해 입력한 검색어를 Google에 전송합니다. 브라우저가 요청을 차단할 수 있습니다.
On · Google suggestions|Ativo · Sugestões do Google|Ativado · Sugestões do Google|Activado · Sugerencias de Google|Activé · Suggestions Google|An · Google-Vorschläge|オン · Googleの候補|켜짐 · Google 제안
Off · Local history only|Inativo · Apenas histórico local|Desativado · Apenas histórico local|Desactivado · Solo historial local|Désactivé · Historique local uniquement|Aus · Nur lokaler Verlauf|オフ · ローカル履歴のみ|꺼짐 · 로컬 기록만
Pause background video|Pausar vídeo de fundo|Pausar vídeo de fundo|Pausar vídeo de fondo|Mettre la vidéo de fond en pause|Hintergrundvideo pausieren|背景動画を一時停止|배경 동영상 일시 정지
Keep video backgrounds still for a calmer dashboard.|Mantém os vídeos de fundo parados para um painel mais tranquilo.|Mantém os vídeos de fundo parados para um painel mais tranquilo.|Detén los vídeos de fondo para un panel más tranquilo.|Fige les vidéos de fond pour un tableau de bord plus calme.|Hält Hintergrundvideos für ein ruhigeres Dashboard an.|背景動画を停止して、落ち着いた画面にします。|차분한 대시보드를 위해 배경 동영상을 멈춥니다.
On · Video paused|Ativo · Vídeo pausado|Ativado · Vídeo pausado|Activado · Vídeo pausado|Activé · Vidéo en pause|An · Video pausiert|オン · 動画停止中|켜짐 · 동영상 정지됨
Off · Video can play|Inativo · Vídeo pode reproduzir|Desativado · Vídeo pode reproduzir|Desactivado · Vídeo activo|Désactivé · Vidéo autorisée|Aus · Video darf abspielen|オフ · 動画を再生|꺼짐 · 동영상 재생 가능
Keyboard Shortcuts|Atalhos de teclado|Atalhos de teclado|Atajos de teclado|Raccourcis clavier|Tastenkürzel|キーボードショートカット|키보드 단축키
Focus Search|Focar pesquisa|Focar pesquisa|Activar búsqueda|Activer la recherche|Suchfeld fokussieren|検索にフォーカス|검색창 선택
Close Suggestions|Fechar sugestões|Fechar sugestões|Cerrar sugerencias|Fermer les suggestions|Vorschläge schließen|候補を閉じる|제안 닫기
Navigate List|Navegar na lista|Navegar na lista|Navegar por la lista|Parcourir la liste|Liste durchgehen|リストを移動|목록 탐색
Clear Engine Prefix|Limpar prefixo de pesquisa|Limpar prefixo de pesquisa|Borrar prefijo del buscador|Effacer le préfixe du moteur|Suchpräfix entfernen|検索エンジンの接頭辞を消去|검색 엔진 접두사 지우기
Search Prefixes|Prefixos de pesquisa|Prefixos de pesquisa|Prefijos de búsqueda|Préfixes de recherche|Suchpräfixe|検索の接頭辞|검색 접두사
Backup & Restore|Cópia de segurança e restauro|Backup e restauração|Copia de seguridad y restauración|Sauvegarde et restauration|Sicherung und Wiederherstellung|バックアップと復元|백업 및 복원
⬇ Export Settings|⬇ Exportar definições|⬇ Exportar configurações|⬇ Exportar ajustes|⬇ Exporter les paramètres|⬇ Einstellungen exportieren|⬇ 設定を書き出す|⬇ 설정 내보내기
⬆ Import Settings|⬆ Importar definições|⬆ Importar configurações|⬆ Importar ajustes|⬆ Importer les paramètres|⬆ Einstellungen importieren|⬆ 設定を読み込む|⬆ 설정 가져오기
Save your configuration, speed dials, and layout preferences to a file.|Guarda as definições, os atalhos e a disposição num ficheiro.|Salve configurações, atalhos e preferências de layout em um arquivo.|Guarda ajustes, accesos rápidos y diseño en un archivo.|Enregistrez vos paramètres, raccourcis et préférences de disposition dans un fichier.|Speichere Einstellungen, Schnellzugriffe und Layout in einer Datei.|設定、ショートカット、レイアウトをファイルに保存します。|설정, 바로가기 및 레이아웃 환경설정을 파일에 저장합니다.
Danger Zone|Zona de perigo|Zona de perigo|Zona de peligro|Zone de danger|Gefahrenzone|危険な操作|위험 영역
🗑 Reset All Settings|🗑 Repor todas as definições|🗑 Redefinir configurações|🗑 Restablecer todos los ajustes|🗑 Réinitialiser les paramètres|🗑 Alle Einstellungen zurücksetzen|🗑 すべての設定をリセット|🗑 모든 설정 초기화
Support Aura on Buy Me a Coffee|Apoiar o Aura no Buy Me a Coffee|Apoiar o Aura no Buy Me a Coffee|Apoya a Aura en Buy Me a Coffee|Soutenir Aura sur Buy Me a Coffee|Aura auf Buy Me a Coffee unterstützen|Buy Me a CoffeeでAuraを応援|Buy Me a Coffee에서 Aura 후원
Reset settings|Repor definições|Redefinir configurações|Restablecer ajustes|Réinitialiser les paramètres|Einstellungen zurücksetzen|設定をリセット|설정 초기화
Are you sure you want to reset all settings?|Queres mesmo repor todas as definições?|Tem certeza de que deseja redefinir todas as configurações?|¿Seguro que quieres restablecer todos los ajustes?|Voulez-vous vraiment réinitialiser tous les paramètres ?|Möchtest du wirklich alle Einstellungen zurücksetzen?|すべての設定をリセットしますか？|모든 설정을 초기화하시겠습니까?
This will clear all your preferences, speed dials, and saved data.|Isto irá apagar as preferências, os atalhos e os dados guardados.|Isso apagará preferências, atalhos e dados salvos.|Se borrarán tus preferencias, accesos rápidos y datos guardados.|Vos préférences, raccourcis et données enregistrées seront effacés.|Dadurch werden Einstellungen, Schnellzugriffe und gespeicherte Daten gelöscht.|設定、ショートカット、保存データが消去されます。|환경설정, 바로가기 및 저장된 데이터가 삭제됩니다.
Yes, Reset|Sim, repor|Sim, redefinir|Sí, restablecer|Oui, réinitialiser|Ja, zurücksetzen|リセットする|예, 초기화
⚠️ This cannot be undone|⚠️ Esta ação é irreversível|⚠️ Esta ação não pode ser desfeita|⚠️ Esto no se puede deshacer|⚠️ Cette action est irréversible|⚠️ Dies kann nicht rückgängig gemacht werden|⚠️ この操作は取り消せません|⚠️ 이 작업은 취소할 수 없습니다
All settings, cached location, background, and stored data will be permanently erased. The page will reload.|Todas as definições, localização em cache, fundo e dados serão apagados permanentemente. A página será recarregada.|Todas as configurações, localização em cache, fundo e dados serão apagados permanentemente. A página será recarregada.|Se borrarán permanentemente los ajustes, ubicación guardada, fondo y datos. La página se recargará.|Tous les paramètres, la position en cache, le fond et les données seront définitivement effacés. La page sera rechargée.|Alle Einstellungen, Standortdaten, Hintergründe und gespeicherten Daten werden endgültig gelöscht. Die Seite wird neu geladen.|設定、保存した位置情報、背景、データが完全に削除され、ページが再読み込みされます。|모든 설정, 캐시된 위치, 배경 및 저장된 데이터가 영구 삭제되고 페이지가 새로고침됩니다.
Go Back|Voltar|Voltar|Volver|Retour|Zurück|戻る|뒤로
Yes, Erase Everything|Sim, apagar tudo|Sim, apagar tudo|Sí, borrar todo|Oui, tout effacer|Ja, alles löschen|すべて消去する|예, 모두 삭제
Reset Failed|Falha ao repor|Falha ao redefinir|Error al restablecer|Échec de la réinitialisation|Zurücksetzen fehlgeschlagen|リセットに失敗しました|초기화 실패
Could not erase saved data. Please try again.|Não foi possível apagar os dados guardados. Tenta novamente.|Não foi possível apagar os dados salvos. Tente novamente.|No se pudieron borrar los datos. Inténtalo de nuevo.|Impossible d’effacer les données. Réessayez.|Gespeicherte Daten konnten nicht gelöscht werden. Versuche es erneut.|保存データを消去できませんでした。もう一度お試しください。|저장된 데이터를 삭제할 수 없습니다. 다시 시도하세요.
Import Failed|Falha na importação|Falha na importação|Error de importación|Échec de l’importation|Import fehlgeschlagen|読み込みに失敗しました|가져오기 실패
Backup exceeds the 1 MB limit.|A cópia de segurança excede o limite de 1 MB.|O backup excede o limite de 1 MB.|La copia supera el límite de 1 MB.|La sauvegarde dépasse la limite de 1 Mo.|Die Sicherung überschreitet das Limit von 1 MB.|バックアップが上限の1 MBを超えています。|백업이 1MB 제한을 초과합니다.
Success!|Sucesso!|Sucesso!|¡Listo!|Réussi !|Erfolgreich!|完了！|완료!
Your settings and customization have been successfully restored. The dashboard needs to reload to apply the changes.|As definições e personalizações foram restauradas. É necessário recarregar o painel para aplicar as alterações.|As configurações e personalizações foram restauradas. É necessário recarregar o painel para aplicar as alterações.|Se han restaurado tus ajustes y personalizaciones. Recarga el panel para aplicar los cambios.|Vos paramètres et personnalisations ont été restaurés. Rechargez le tableau de bord pour appliquer les modifications.|Deine Einstellungen wurden wiederhergestellt. Lade das Dashboard neu, um die Änderungen anzuwenden.|設定を復元しました。変更を適用するには再読み込みが必要です。|설정과 사용자 지정이 복원되었습니다. 변경 사항을 적용하려면 대시보드를 새로고침해야 합니다.
Could not restore settings.|Não foi possível restaurar as definições.|Não foi possível restaurar as configurações.|No se pudieron restaurar los ajustes.|Impossible de restaurer les paramètres.|Einstellungen konnten nicht wiederhergestellt werden.|設定を復元できませんでした。|설정을 복원할 수 없습니다.
Could not read the backup file.|Não foi possível ler a cópia de segurança.|Não foi possível ler o arquivo de backup.|No se pudo leer la copia de seguridad.|Impossible de lire la sauvegarde.|Sicherungsdatei konnte nicht gelesen werden.|バックアップファイルを読み取れませんでした。|백업 파일을 읽을 수 없습니다.
Reload Dashboard|Recarregar painel|Recarregar painel|Recargar panel|Recharger le tableau de bord|Dashboard neu laden|再読み込み|대시보드 새로고침
Dismiss|Fechar|Fechar|Cerrar|Fermer|Schließen|閉じる|닫기
Share your setup|Partilha o teu ambiente|Compartilhe seu ambiente|Comparte tu espacio|Partagez votre configuration|Teile deine Einrichtung|設定を共有|설정 공유
A small preset for your theme, font and Lofi stations. Add your wallpaper to share the whole look.|Um preset com o tema, tipo de letra e estações Lofi. Adiciona o fundo para partilhar o visual completo.|Um preset com tema, fonte e estações Lofi. Adicione o fundo para compartilhar o visual completo.|Un preset con tu tema, fuente y emisoras Lofi. Añade tu fondo para compartir todo el estilo.|Un préréglage avec votre thème, police et stations Lofi. Ajoutez le fond pour partager l’ensemble.|Eine Vorlage für Design, Schrift und Lofi-Sender. Füge deinen Hintergrund hinzu, um den ganzen Look zu teilen.|テーマ、フォント、Lofiステーションを共有できます。背景も含めると、見た目全体を共有できます。|테마, 글꼴 및 로파이 방송국을 공유하세요. 배경도 포함하면 전체 스타일을 공유할 수 있습니다.
Include wallpaper|Incluir fundo|Incluir fundo|Incluir fondo|Inclure le fond|Hintergrund einschließen|背景を含める|배경 포함
Uploaded images and videos make a larger file.|As imagens e vídeos aumentam o tamanho do ficheiro.|Imagens e vídeos aumentam o tamanho do arquivo.|Las imágenes y los vídeos aumentan el tamaño del archivo.|Les images et vidéos augmentent la taille du fichier.|Bilder und Videos vergrößern die Datei.|画像や動画を含めるとファイルが大きくなります。|이미지와 동영상을 포함하면 파일이 커집니다.
Export preset|Exportar preset|Exportar preset|Exportar preset|Exporter le préréglage|Vorlage exportieren|プリセットを書き出す|프리셋 내보내기
Import preset|Importar preset|Importar preset|Importar preset|Importer le préréglage|Vorlage importieren|プリセットを読み込む|프리셋 가져오기
Import appearance preset file|Importar ficheiro de aparência|Importar arquivo de aparência|Importar archivo de apariencia|Importer un fichier d’apparence|Darstellungsvorlage importieren|外観プリセットを読み込む|모양 프리셋 파일 가져오기
Preparing your preset…|A preparar o preset…|Preparando o preset…|Preparando tu preset…|Préparation du préréglage…|Vorlage wird vorbereitet…|プリセットを準備中…|프리셋 준비 중…
Preset exported. Share the file with a friend.|Preset exportado. Partilha o ficheiro com um amigo.|Preset exportado. Compartilhe o arquivo com um amigo.|Preset exportado. Comparte el archivo con un amigo.|Préréglage exporté. Partagez le fichier avec un ami.|Vorlage exportiert. Teile die Datei mit Freunden.|プリセットを書き出しました。ファイルを友達と共有できます。|프리셋을 내보냈습니다. 친구와 파일을 공유하세요.
Preset applied. Enjoy your new setup.|Preset aplicado. Desfruta do teu novo ambiente.|Preset aplicado. Aproveite seu novo ambiente.|Preset aplicado. Disfruta de tu nuevo espacio.|Préréglage appliqué. Profitez de votre nouvelle configuration.|Vorlage angewendet. Viel Spaß mit deiner neuen Einrichtung.|プリセットを適用しました。新しい設定をお楽しみください。|프리셋이 적용되었습니다. 새로운 설정을 즐겨 보세요.
Preset is too large (50 MB wallpaper limit).|Preset demasiado grande (limite de 50 MB para o fundo).|Preset muito grande (limite de 50 MB para o fundo).|Preset demasiado grande (límite de 50 MB para el fondo).|Préréglage trop volumineux (fond limité à 50 Mo).|Vorlage zu groß (Hintergrundlimit: 50 MB).|プリセットが大きすぎます（背景の上限は50 MB）。|프리셋이 너무 큽니다 (배경 제한: 50MB).
Could not read this preset file.|Não foi possível ler este preset.|Não foi possível ler este preset.|No se pudo leer este preset.|Impossible de lire ce préréglage.|Vorlagendatei konnte nicht gelesen werden.|プリセットを読み取れませんでした。|프리셋 파일을 읽을 수 없습니다.
Wallpaper|Fundo|Fundo|Fondo|Fond d’écran|Hintergrund|壁紙|배경화면
Aura default animation|Animação predefinida do Aura|Animação padrão do Aura|Animación predeterminada de Aura|Animation par défaut d’Aura|Aura-Standardanimation|Aura標準のアニメーション|Aura 기본 애니메이션
Keep your current wallpaper|Manter o fundo atual|Manter o fundo atual|Mantener tu fondo actual|Conserver le fond actuel|Aktuellen Hintergrund behalten|現在の背景を維持|현재 배경 유지
Music|Música|Música|Música|Musique|Musik|音楽|음악
stations.one|{count} estação Lofi|{count} estação Lofi|{count} emisora Lofi|{count} station Lofi|{count} Lofi-Sender|Lofiステーション {count}件|로파이 방송국 {count}개
stations.other|{count} estações Lofi|{count} estações Lofi|{count} emisoras Lofi|{count} stations Lofi|{count} Lofi-Sender|Lofiステーション {count}件|로파이 방송국 {count}개
Your profile, daily tasks and dashboard layout stay as they are.|O perfil, as tarefas diárias e a disposição do painel mantêm-se.|Seu perfil, tarefas diárias e layout do painel permanecem iguais.|Tu perfil, tareas diarias y diseño del panel se mantienen.|Votre profil, vos tâches et la disposition restent inchangés.|Profil, Tagesaufgaben und Dashboard-Layout bleiben erhalten.|プロフィール、今日のタスク、レイアウトは変更されません。|프로필, 일일 할 일 및 대시보드 레이아웃은 유지됩니다.
Apply preset|Aplicar preset|Aplicar preset|Aplicar preset|Appliquer le préréglage|Vorlage anwenden|プリセットを適用|프리셋 적용
Good morning|Bom dia|Bom dia|Buenos días|Bonjour|Guten Morgen|おはようございます|좋은 아침이에요
Good afternoon|Boa tarde|Boa tarde|Buenas tardes|Bon après-midi|Guten Tag|こんにちは|좋은 오후예요
Good evening|Boa noite|Boa noite|Buenas noches|Bonsoir|Guten Abend|こんばんは|좋은 저녁이에요
Time to rest|Hora de descansar|Hora de descansar|Hora de descansar|Il est temps de se reposer|Zeit zum Ausruhen|ゆっくり休みましょう|쉴 시간이에요
Hello, {name}|Olá, {name}|Olá, {name}|Hola, {name}|Bonjour, {name}|Hallo, {name}|こんにちは、{name}|안녕하세요, {name}
Hello|Olá|Olá|Hola|Bonjour|Hallo|こんにちは|안녕하세요
Friend|amigo|amigo|amigo|ami|Freund|友達|친구
Click for a new quote|Clica para outra frase|Clique para outra frase|Pulsa para otra frase|Cliquez pour une autre citation|Für ein neues Zitat klicken|クリックで別の名言を表示|클릭하여 다른 명언 보기
Clear|Céu limpo|Céu limpo|Despejado|Dégagé|Klar|晴れ|맑음
Partly cloudy|Pouco nublado|Parcialmente nublado|Parcialmente nublado|Partiellement nuageux|Teilweise bewölkt|晴れ時々曇り|구름 조금
Cloudy|Nublado|Nublado|Nublado|Nuageux|Bewölkt|曇り|흐림
Rain|Chuva|Chuva|Lluvia|Pluie|Regen|雨|비
Snow|Neve|Neve|Nieve|Neige|Schnee|雪|눈
Storm|Trovoada|Tempestade|Tormenta|Orage|Gewitter|雷雨|뇌우
Fog|Nevoeiro|Neblina|Niebla|Brouillard|Nebel|霧|안개
Drizzle|Chuviscos|Garoa|Llovizna|Bruine|Nieselregen|霧雨|이슬비
Frost|Geada|Geada|Helada|Gel|Frost|霜|서리
Loading weather|A carregar meteorologia|Carregando clima|Cargando el tiempo|Chargement de la météo|Wetter wird geladen|天気を読み込み中|날씨 불러오는 중
Weather unavailable|Meteorologia indisponível|Clima indisponível|Tiempo no disponible|Météo indisponible|Wetter nicht verfügbar|天気を取得できません|날씨를 사용할 수 없음
Weather Error|Erro de meteorologia|Erro de clima|Error del tiempo|Erreur météo|Wetterfehler|天気のエラー|날씨 오류
Weather failed to load. Click to retry.|Falha ao carregar meteorologia. Clica para tentar novamente.|Falha ao carregar clima. Clique para tentar novamente.|No se pudo cargar el tiempo. Pulsa para reintentar.|Impossible de charger la météo. Cliquez pour réessayer.|Wetter konnte nicht geladen werden. Zum Wiederholen klicken.|天気を読み込めませんでした。クリックして再試行してください。|날씨를 불러오지 못했습니다. 클릭하여 다시 시도하세요.
Toggle weather details|Mostrar ou ocultar detalhes meteorológicos|Mostrar ou ocultar detalhes do clima|Mostrar u ocultar detalles del tiempo|Afficher ou masquer les détails météo|Wetterdetails ein- oder ausblenden|天気の詳細を開閉|날씨 상세 정보 열기 또는 닫기
Weather Details|Detalhes meteorológicos|Detalhes do clima|Detalles del tiempo|Détails météo|Wetterdetails|天気の詳細|날씨 상세 정보
Feels like|Sensação térmica|Sensação térmica|Sensación térmica|Ressenti|Gefühlt|体感温度|체감 온도
Humidity|Humidade|Umidade|Humedad|Humidité|Luftfeuchtigkeit|湿度|습도
Wind|Vento|Vento|Viento|Vent|Wind|風|바람
Sunrise|Nascer do sol|Nascer do sol|Amanecer|Lever du soleil|Sonnenaufgang|日の出|일출
Sunset|Pôr do sol|Pôr do sol|Atardecer|Coucher du soleil|Sonnenuntergang|日の入り|일몰
3-Day Forecast|Previsão de 3 dias|Previsão de 3 dias|Previsión de 3 días|Prévisions sur 3 jours|3-Tage-Vorhersage|3日間の予報|3일 예보
Location access denied. Showing fallback.|Acesso à localização recusado. A mostrar alternativa.|Acesso à localização negado. Mostrando alternativa.|Ubicación denegada. Mostrando alternativa.|Localisation refusée. Position de secours affichée.|Standortzugriff verweigert. Ersatzstandort wird angezeigt.|位置情報が拒否されました。代替の場所を表示しています。|위치 권한이 거부되었습니다. 대체 위치를 표시합니다.
Showing saved weather; refresh unavailable.|A mostrar meteorologia guardada; atualização indisponível.|Mostrando clima salvo; atualização indisponível.|Mostrando el tiempo guardado; actualización no disponible.|Météo enregistrée affichée ; actualisation indisponible.|Gespeichertes Wetter; Aktualisierung nicht verfügbar.|保存した天気を表示中です。更新できません。|저장된 날씨를 표시합니다. 새로고침할 수 없습니다.
Offline. Updated {time}|Offline. Atualizado às {time}|Offline. Atualizado às {time}|Sin conexión. Actualizado a las {time}|Hors ligne. Mise à jour à {time}|Offline. Aktualisiert um {time}|オフライン。更新：{time}|오프라인. 업데이트: {time}
Today's Focus|Foco de hoje|Foco de hoje|Enfoque de hoy|Objectifs du jour|Heutiger Fokus|今日の集中|오늘의 집중
A little space to get things done|Um espaço para concretizar|Um espaço para realizar|Un espacio para avanzar|Un espace pour avancer|Ein wenig Raum zum Weiterkommen|やるべきことに向き合う場所|할 일에 집중하는 공간
Completion chime|Som de conclusão|Som de conclusão|Sonido de finalización|Son de fin|Abschlusston|完了音|완료 알림음
Completion chime on|Som de conclusão ativo|Som de conclusão ativado|Sonido de finalización activado|Son de fin activé|Abschlusston an|完了音オン|완료 알림음 켜짐
Completion chime off|Som de conclusão inativo|Som de conclusão desativado|Sonido de finalización desactivado|Son de fin désactivé|Abschlusston aus|完了音オフ|완료 알림음 꺼짐
Timer mode|Modo do temporizador|Modo do temporizador|Modo del temporizador|Mode du minuteur|Timer-Modus|タイマーのモード|타이머 모드
Focus|Foco|Foco|Enfoque|Concentration|Fokus|集中|집중
Break|Pausa|Pausa|Descanso|Pause|Pause|休憩|휴식
25 min|25 min|25 min|25 min|25 min|25 Min.|25分|25분
5 min|5 min|5 min|5 min|5 min|5 Min.|5分|5분
{mode} time remaining|Tempo restante de {mode}|Tempo restante de {mode}|Tiempo restante de {mode}|Temps restant : {mode}|Verbleibende Zeit: {mode}|{mode}の残り時間|{mode} 남은 시간
One thing at a time.|Uma coisa de cada vez.|Uma coisa de cada vez.|Una cosa a la vez.|Une chose à la fois.|Eins nach dem anderen.|一つずつ進めましょう。|한 번에 하나씩.
Breathe. Stretch. Reset.|Respira. Alonga. Recomeça.|Respire. Alongue. Recomece.|Respira. Estira. Reinicia.|Respirez. Étirez-vous. Reprenez.|Atmen. Dehnen. Neu starten.|深呼吸して、伸びをして、リセット。|숨 쉬고, 스트레칭하고, 다시 시작해요.
Paused · Pick up where you left off|Em pausa · Continua de onde ficaste|Pausado · Continue de onde parou|En pausa · Continúa donde lo dejaste|En pause · Reprenez où vous en étiez|Pausiert · Mach weiter, wo du aufgehört hast|一時停止中 · 続きから始めましょう|일시 정지됨 · 이어서 시작하세요
Make room for what matters.|Dá espaço ao que importa.|Dê espaço ao que importa.|Haz espacio para lo importante.|Faites place à l’essentiel.|Schaffe Raum für das Wesentliche.|大切なことに時間を。|중요한 일을 위한 시간을 만드세요.
A moment to recharge.|Um momento para recuperar.|Um momento para recarregar.|Un momento para recargar.|Un moment pour se ressourcer.|Ein Moment zum Auftanken.|ひと息ついて充電しましょう。|잠시 재충전하세요.
Pause|Pausar|Pausar|Pausar|Pause|Pausieren|一時停止|일시 정지
Resume|Continuar|Continuar|Continuar|Reprendre|Fortsetzen|再開|계속
Start focus|Iniciar foco|Iniciar foco|Iniciar enfoque|Se concentrer|Fokus starten|集中を開始|집중 시작
Start break|Iniciar pausa|Iniciar pausa|Iniciar descanso|Faire une pause|Pause starten|休憩を開始|휴식 시작
Reset timer|Repor temporizador|Redefinir temporizador|Reiniciar temporizador|Réinitialiser le minuteur|Timer zurücksetzen|タイマーをリセット|타이머 초기화
Focus complete. Take a five-minute break.|Foco concluído. Faz uma pausa de cinco minutos.|Foco concluído. Faça uma pausa de cinco minutos.|Enfoque completado. Descansa cinco minutos.|Session terminée. Faites une pause de cinq minutes.|Fokus beendet. Mach fünf Minuten Pause.|集中時間が終了しました。5分間休憩しましょう。|집중 시간이 끝났습니다. 5분간 쉬세요.
Break complete. Ready for another focus session?|Pausa concluída. Pronto para outra sessão de foco?|Pausa concluída. Pronto para outra sessão de foco?|Descanso terminado. ¿Listo para otra sesión?|Pause terminée. Prêt pour une autre session ?|Pause beendet. Bereit für die nächste Runde?|休憩が終了しました。次の集中時間を始めますか？|휴식이 끝났습니다. 다시 집중할 준비가 되셨나요?
Today's priorities|Prioridades de hoje|Prioridades de hoje|Prioridades de hoy|Priorités du jour|Heutige Prioritäten|今日の優先事項|오늘의 우선순위
{completed}/{total} done|{completed}/{total} concluídas|{completed}/{total} concluídas|{completed}/{total} completadas|{completed}/{total} terminées|{completed}/{total} erledigt|{completed}/{total} 完了|{completed}/{total} 완료
Up to 3 tasks|Até 3 tarefas|Até 3 tarefas|Hasta 3 tareas|Jusqu’à 3 tâches|Bis zu 3 Aufgaben|最大3件のタスク|최대 3개의 할 일
Today's focus tasks|Tarefas de foco de hoje|Tarefas de foco de hoje|Tareas de enfoque de hoy|Tâches du jour|Heutige Fokusaufgaben|今日の集中タスク|오늘의 집중 할 일
Remove task: {task}|Remover tarefa: {task}|Remover tarefa: {task}|Eliminar tarea: {task}|Supprimer la tâche : {task}|Aufgabe entfernen: {task}|タスクを削除：{task}|할 일 삭제: {task}
Remove task|Remover tarefa|Remover tarefa|Eliminar tarea|Supprimer la tâche|Aufgabe entfernen|タスクを削除|할 일 삭제
New focus task|Nova tarefa de foco|Nova tarefa de foco|Nueva tarea de enfoque|Nouvelle tâche|Neue Fokusaufgabe|新しい集中タスク|새 집중 할 일
One more small goal…|Mais um pequeno objetivo…|Mais uma pequena meta…|Otro pequeño objetivo…|Un autre petit objectif…|Noch ein kleines Ziel…|もう一つ、小さな目標を…|작은 목표를 하나 더…
What matters most today?|O que importa mais hoje?|O que mais importa hoje?|¿Qué importa más hoy?|Qu’est-ce qui compte aujourd’hui ?|Was ist heute am wichtigsten?|今日、一番大切なことは？|오늘 가장 중요한 일은 무엇인가요?
Add focus task|Adicionar tarefa de foco|Adicionar tarefa de foco|Añadir tarea de enfoque|Ajouter une tâche|Fokusaufgabe hinzufügen|集中タスクを追加|집중 할 일 추가
Add task|Adicionar tarefa|Adicionar tarefa|Añadir tarea|Ajouter une tâche|Aufgabe hinzufügen|タスクを追加|할 일 추가
Your three priorities are set. You've got this.|As tuas três prioridades estão definidas. Tu consegues.|Suas três prioridades estão definidas. Você consegue.|Tus tres prioridades están listas. Tú puedes.|Vos trois priorités sont définies. Vous pouvez le faire.|Deine drei Prioritäten stehen fest. Du schaffst das.|優先事項が3件そろいました。きっとうまくいきます。|세 가지 우선순위가 정해졌어요. 할 수 있어요.
Anime Schedule|Calendário de anime|Calendário de anime|Calendario de anime|Programme anime|Anime-Zeitplan|アニメ放送予定|애니메이션 편성표
Daily Airing Episodes|Episódios emitidos por dia|Episódios exibidos por dia|Episodios emitidos por día|Épisodes diffusés chaque jour|Täglich ausgestrahlte Folgen|毎日の放送エピソード|일일 방영 에피소드
Close Sidebar|Fechar painel lateral|Fechar painel lateral|Cerrar panel lateral|Fermer le panneau|Seitenleiste schließen|サイドバーを閉じる|사이드바 닫기
Showing saved schedule · Live update unavailable|A mostrar calendário guardado · Atualização indisponível|Mostrando calendário salvo · Atualização indisponível|Calendario guardado · Actualización no disponible|Programme enregistré · Actualisation indisponible|Gespeicherter Zeitplan · Live-Update nicht verfügbar|保存した予定を表示中 · 更新できません|저장된 편성표 · 실시간 업데이트 불가
Couldn't connect to AniList right now.|Não foi possível ligar ao AniList agora.|Não foi possível conectar ao AniList agora.|No se pudo conectar con AniList.|Impossible de se connecter à AniList.|Verbindung zu AniList derzeit nicht möglich.|現在AniListに接続できません。|지금 AniList에 연결할 수 없습니다.
No anime scheduled.|Nenhum anime agendado.|Nenhum anime agendado.|No hay anime programado.|Aucun anime programmé.|Keine Anime geplant.|放送予定のアニメはありません。|예정된 애니메이션이 없습니다.
Today's Launch|Estreias de hoje|Lançamentos de hoje|Estrenos de hoy|Sorties du jour|Heutige Folgen|今日の放送|오늘의 방영
Sorting Info|Informação de ordenação|Informações de ordenação|Información de ordenación|Informations sur le tri|Informationen zur Sortierung|並び順について|정렬 정보
We automatically prioritize the shows you are currently watching on MyAnimeList, then fill the remaining spots with today's top-rated premieres.|Priorizamos os animes que estás a ver no MyAnimeList e preenchemos os restantes lugares com as estreias mais bem avaliadas de hoje.|Priorizamos os animes que você está assistindo no MyAnimeList e preenchemos as demais vagas com os lançamentos mais bem avaliados de hoje.|Priorizamos los animes que estás viendo en MyAnimeList y completamos los espacios con los estrenos mejor valorados de hoy.|Nous donnons la priorité aux animes que vous suivez sur MyAnimeList, puis aux sorties les mieux notées du jour.|Zuerst erscheinen deine aktuell auf MyAnimeList geschauten Serien, dann die bestbewerteten heutigen Ausstrahlungen.|MyAnimeListで視聴中の作品を優先し、残りに今日の評価が高い放送作品を表示します。|MyAnimeList에서 시청 중인 작품을 우선 표시하고, 남은 자리에 오늘의 평점 높은 방영작을 표시합니다.
No anime airing today.|Nenhum anime emitido hoje.|Nenhum anime em exibição hoje.|Hoy no se emite anime.|Aucun anime diffusé aujourd’hui.|Heute werden keine Anime ausgestrahlt.|今日放送のアニメはありません。|오늘 방영되는 애니메이션이 없습니다.
Out Now!|Já disponível!|Já disponível!|¡Ya disponible!|Disponible !|Jetzt verfügbar!|放送済み！|지금 시청 가능!
No synopsis available.|Sinopse indisponível.|Sinopse indisponível.|Sin sinopsis disponible.|Synopsis indisponible.|Keine Zusammenfassung verfügbar.|あらすじはありません。|줄거리가 없습니다.
View on MyAnimeList ↗|Ver no MyAnimeList ↗|Ver no MyAnimeList ↗|Ver en MyAnimeList ↗|Voir sur MyAnimeList ↗|Auf MyAnimeList ansehen ↗|MyAnimeListで見る ↗|MyAnimeList에서 보기 ↗
{title} Trailer|Trailer de {title}|Trailer de {title}|Tráiler de {title}|Bande-annonce de {title}|Trailer zu {title}|{title}の予告編|{title} 예고편
Unknown Title|Título desconhecido|Título desconhecido|Título desconocido|Titre inconnu|Unbekannter Titel|不明なタイトル|알 수 없는 제목
N/A|N/D|N/D|N/D|N/D|k. A.|不明|정보 없음
Connecting to MyAnimeList… This may take a few moments.|A ligar ao MyAnimeList… Pode demorar alguns instantes.|Conectando ao MyAnimeList… Isso pode levar alguns instantes.|Conectando con MyAnimeList… Puede tardar un momento.|Connexion à MyAnimeList… Cela peut prendre un instant.|Verbindung zu MyAnimeList… Dies kann einen Moment dauern.|MyAnimeListに接続中…しばらくお待ちください。|MyAnimeList에 연결 중… 잠시 기다려 주세요.
Showing your saved watching list (saved {time}). MyAnimeList’s full list could not be refreshed.|A mostrar a lista guardada às {time}. Não foi possível atualizar a lista completa do MyAnimeList.|Mostrando a lista salva às {time}. Não foi possível atualizar a lista completa do MyAnimeList.|Mostrando tu lista guardada a las {time}. No se pudo actualizar la lista completa de MyAnimeList.|Liste enregistrée à {time}. Impossible d’actualiser la liste complète MyAnimeList.|Gespeicherte Liste von {time}. Die vollständige MyAnimeList-Liste konnte nicht aktualisiert werden.|{time}に保存したリストを表示中です。MyAnimeListの全リストを更新できませんでした。|{time}에 저장된 시청 목록을 표시합니다. MyAnimeList 전체 목록을 새로고침할 수 없습니다.
Showing your saved watching list. MyAnimeList’s full list could not be refreshed.|A mostrar a lista guardada. Não foi possível atualizar a lista completa do MyAnimeList.|Mostrando a lista salva. Não foi possível atualizar a lista completa do MyAnimeList.|Mostrando tu lista guardada. No se pudo actualizar la lista completa de MyAnimeList.|Liste enregistrée affichée. Impossible d’actualiser la liste complète MyAnimeList.|Gespeicherte Liste. Die vollständige MyAnimeList-Liste konnte nicht aktualisiert werden.|保存したリストを表示中です。MyAnimeListの全リストを更新できませんでした。|저장된 시청 목록을 표시합니다. MyAnimeList 전체 목록을 새로고침할 수 없습니다.
Too many requests right now. Please wait a moment before retrying.|Demasiados pedidos. Aguarda um momento antes de tentar novamente.|Muitas solicitações. Aguarde um momento antes de tentar novamente.|Demasiadas solicitudes. Espera antes de reintentar.|Trop de requêtes. Patientez avant de réessayer.|Zu viele Anfragen. Warte kurz und versuche es erneut.|リクエストが多すぎます。少し待ってから再試行してください。|요청이 너무 많습니다. 잠시 후 다시 시도하세요.
MyAnimeList is temporarily unavailable or timed out. Please retry in a moment.|O MyAnimeList está indisponível ou demorou demasiado. Tenta novamente em breve.|O MyAnimeList está indisponível ou demorou demais. Tente novamente em breve.|MyAnimeList no está disponible o tardó demasiado. Reintenta en un momento.|MyAnimeList est indisponible ou trop lent. Réessayez dans un instant.|MyAnimeList ist nicht verfügbar oder hat zu lange gebraucht. Versuche es gleich erneut.|MyAnimeListが利用できないか、タイムアウトしました。しばらくして再試行してください。|MyAnimeList를 사용할 수 없거나 시간이 초과되었습니다. 잠시 후 다시 시도하세요.
Could not load your list. Check your username and that your MAL anime list is public, then retry.|Não foi possível carregar a lista. Confirma o nome de utilizador e se a lista MAL é pública.|Não foi possível carregar a lista. Confira o nome de usuário e se a lista MAL é pública.|No se pudo cargar tu lista. Comprueba tu usuario y que la lista MAL sea pública.|Impossible de charger la liste. Vérifiez votre identifiant et que la liste MAL est publique.|Liste konnte nicht geladen werden. Prüfe Benutzername und ob deine MAL-Liste öffentlich ist.|リストを読み込めませんでした。ユーザー名とMALリストの公開設定を確認してください。|목록을 불러올 수 없습니다. 사용자 이름과 MAL 목록 공개 여부를 확인하세요.
Connected · Full watching list synced|Ligado · Lista completa sincronizada|Conectado · Lista completa sincronizada|Conectado · Lista completa sincronizada|Connecté · Liste complète synchronisée|Verbunden · Vollständige Liste synchronisiert|接続済み · 視聴リスト同期完了|연결됨 · 전체 시청 목록 동기화됨
Refresh watching list|Atualizar lista de anime|Atualizar lista de animes|Actualizar lista de seguimiento|Actualiser la liste suivie|Aktuelle Liste aktualisieren|視聴リストを更新|시청 목록 새로고침
Retry full list|Tentar lista completa novamente|Tentar lista completa novamente|Reintentar lista completa|Réessayer la liste complète|Vollständige Liste erneut laden|全リストを再取得|전체 목록 다시 시도
Lofi Background Stream|Transmissão Lofi de fundo|Transmissão Lofi de fundo|Transmisión Lofi de fondo|Flux Lofi d’arrière-plan|Lofi-Hintergrundstream|Lofiバックグラウンド配信|로파이 배경 스트림
Now Playing|A reproduzir|Tocando agora|Reproduciendo|En lecture|Aktuelle Wiedergabe|再生中|지금 재생 중
Starting...|A iniciar…|Iniciando…|Iniciando…|Démarrage…|Wird gestartet…|開始中…|시작 중…
Paused|Em pausa|Pausado|En pausa|En pause|Pausiert|一時停止中|일시 정지됨
Play|Reproduzir|Reproduzir|Reproducir|Lire|Abspielen|再生|재생
Change station|Mudar estação|Mudar estação|Cambiar emisora|Changer de station|Sender wechseln|ステーションを変更|방송국 변경
Click to change station|Clica para mudar de estação|Clique para mudar de estação|Pulsa para cambiar de emisora|Cliquez pour changer de station|Klicken, um den Sender zu wechseln|クリックでステーションを変更|클릭하여 방송국 변경
Retry|Tentar novamente|Tentar novamente|Reintentar|Réessayer|Erneut versuchen|再試行|다시 시도
Something went wrong with this component.|Ocorreu um erro neste componente.|Ocorreu um erro neste componente.|Se produjo un error en este componente.|Une erreur s’est produite dans ce composant.|Bei dieser Komponente ist ein Fehler aufgetreten.|このコンポーネントでエラーが発生しました。|이 구성 요소에 문제가 발생했습니다.
Accents follow the time of day|As cores acompanham a hora do dia|As cores acompanham a hora do dia|Colores según la hora del día|Couleurs selon l’heure du jour|Akzente folgen der Tageszeit|時間帯に合わせたアクセント|시간대에 따른 강조색
Arctic blue · charcoal glass|Azul ártico · vidro carvão|Azul ártico · vidro carvão|Azul ártico · cristal carbón|Bleu arctique · verre anthracite|Arktisblau · Anthrazitglas|氷の青 · チャコールガラス|북극 블루 · 차콜 글라스
Periwinkle · charcoal glass|Azul pervinca · vidro carvão|Azul pervinca · vidro carvão|Azul lavanda · cristal carbón|Bleu pervenche · verre anthracite|Immergrünblau · Anthrazitglas|青紫 · チャコールガラス|페리윙클 · 차콜 글라스
Coral pink · charcoal glass|Rosa coral · vidro carvão|Rosa coral · vidro carvão|Rosa coral · cristal carbón|Rose corail · verre anthracite|Korallrosa · Anthrazitglas|コーラルピンク · チャコールガラス|코랄 핑크 · 차콜 글라스
Fresh green · charcoal glass|Verde fresco · vidro carvão|Verde fresco · vidro carvão|Verde fresco · cristal carbón|Vert frais · verre anthracite|Frisches Grün · Anthrazitglas|若草色 · チャコールガラス|프레시 그린 · 차콜 글라스
Soft lavender · warm charcoal|Lavanda suave · carvão quente|Lavanda suave · carvão quente|Lavanda suave · carbón cálido|Lavande douce · anthracite chaud|Sanftes Lavendel · warmes Anthrazit|柔らかなラベンダー · 暖かなチャコール|부드러운 라벤더 · 따뜻한 차콜
Neon blue · midnight ink|Azul néon · tinta noturna|Azul neon · tinta noturna|Azul neón · tinta nocturna|Bleu néon · encre de minuit|Neonblau · Mitternachtstinte|ネオンブルー · 真夜中のインク|네온 블루 · 미드나이트 잉크
Muted rose · deep plum|Rosa suave · ameixa escura|Rosa suave · ameixa escura|Rosa tenue · ciruela oscuro|Rose discret · prune profond|Gedecktes Rosa · dunkle Pflaume|落ち着いたローズ · 深いプラム|차분한 로즈 · 딥 플럼
Sage green · woodland glass|Verde salva · vidro florestal|Verde sálvia · vidro florestal|Verde salvia · cristal de bosque|Vert sauge · verre forestier|Salbeigrün · Waldglas|セージグリーン · 森のガラス|세이지 그린 · 우드랜드 글라스
`;

const locales = ['pt-PT', 'pt-BR', 'es', 'fr', 'de', 'ja', 'ko'];
export const catalogs = Object.fromEntries(locales.map(locale => [locale, {}]));
for (const row of rows.trim().split('\n')) {
    const [key, ...translations] = row.split('|');
    if (translations.length !== locales.length || translations.some(value => !value)) throw new Error(`Incomplete translation: ${key}`);
    if (Object.hasOwn(catalogs.de, key)) throw new Error(`Duplicate translation: ${key}`);
    locales.forEach((locale, index) => { catalogs[locale][key] = translations[index]; });
}
