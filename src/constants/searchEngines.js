export const ENGINES = {
    'yt ':    { name:'YouTube',    bg:'#FF0000', fg:'#fff', url: q=>`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
    'r ':     { name:'Reddit',     bg:'#FF4500', fg:'#fff', url: q=>`https://www.reddit.com/search/?q=${encodeURIComponent(q)}` },
    'g ':     { name:'Google',     bg:'#4285F4', fg:'#fff', url: q=>`https://www.google.com/search?q=${encodeURIComponent(q)}` },
    'gh ':    { name:'GitHub',     bg:'#b0b0b0', fg:'#000', url: q=>`https://github.com/search?q=${encodeURIComponent(q)}` },
    'ddg ':   { name:'DuckDuckGo', bg:'#DE5833', fg:'#fff', url: q=>`https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
    'wiki ':  { name:'Wikipedia',  bg:'#a0b0bb', fg:'#000', url: q=>`https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}` },
    'mdn ':   { name:'MDN',        bg:'#83d0f2', fg:'#000', url: q=>`https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(q)}` },
    'tw ':    { name:'Twitter/X',  bg:'#1DA1F2', fg:'#fff', url: q=>`https://twitter.com/search?q=${encodeURIComponent(q)}` },
    'a ':     { name:'Amazon',     bg:'#FF9900', fg:'#000', url: q=>`https://www.amazon.com/s?k=${encodeURIComponent(q)}` },
    'mal ':   { name:'MyAnimeList',bg:'#2E51A2', fg:'#fff', url: q=>`https://myanimelist.net/search/all?q=${encodeURIComponent(q)}` },
};
