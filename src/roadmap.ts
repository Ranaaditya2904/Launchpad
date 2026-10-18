export type RoadmapDay = { title: string; detail: string; tag: string };
export type RoadmapWeek = { title: string; subtitle: string; days: RoadmapDay[] };
export const roadmap: RoadmapWeek[] = [
  { title: "Arrays, strings, hashing & OOP", subtitle: "Baseline and fundamentals", days: [
    {title:"Timed diagnostic + arrays",detail:"Take a 45-minute baseline test; record weak areas. Review Big-O.",tag:"DSA + Big-O"},
    {title:"Two pointers",detail:"Solve pair/sort-based array problems; explain brute force first.",tag:"DSA"},
    {title:"Sliding window",detail:"Practice fixed and variable window patterns.",tag:"DSA"},
    {title:"Hash maps and sets",detail:"Frequency counting, lookup optimization, duplicate detection.",tag:"DSA"},
    {title:"Sorting + binary search basics",detail:"Sort-based reasoning and binary search invariants.",tag:"DSA"},
    {title:"Mixed arrays/strings + project intro",detail:"Solve mixed problems; explain PlacementPilot in two minutes.",tag:"Projects"},
    {title:"Weekly test + corrections",detail:"Retest, review mistakes, revise OOP pillars.",tag:"Review"}
  ]},
  { title:"Linked lists, stacks, queues, recursion & binary search", subtitle:"Core data structures", days:[
    {title:"Linked list traversal + reversal",detail:"Implement traversal, insert/delete, reverse list.",tag:"DSA"},
    {title:"Cycle detection + middle node",detail:"Slow/fast pointers; reason about edge cases.",tag:"DSA"},
    {title:"Stacks and queues",detail:"Understand operations, complexity, use cases.",tag:"DSA"},
    {title:"Stack patterns",detail:"Valid Parentheses, Min Stack, next greater element.",tag:"DSA"},
    {title:"Recursion + backtracking basics",detail:"Base case, recursive relation, call stack.",tag:"DSA"},
    {title:"Binary search patterns",detail:"Classic search, boundaries, rotated arrays.",tag:"DSA + SQL"},
    {title:"Mixed test + SQL joins",detail:"Timed practice; revise SELECT, GROUP BY, joins.",tag:"Review"}
  ]},
  { title:"Trees, graphs & DBMS", subtitle:"Trees, graphs and databases", days:[
    {title:"Binary tree traversals",detail:"Preorder, inorder, postorder and level order.",tag:"DSA"},
    {title:"Tree height + diameter",detail:"Recursive tree properties and complexity.",tag:"DSA"},
    {title:"BST search, insert, validate",detail:"BST invariants and lowest common ancestor.",tag:"DSA"},
    {title:"Lowest Common Ancestor + revision",detail:"Practice tree reasoning; revise normalization.",tag:"DSA + DBMS"},
    {title:"BFS, DFS, graph representations",detail:"Adjacency list/matrix; visited set; traversal.",tag:"DSA"},
    {title:"Graph problems + SQL",detail:"Connected components, joins, subqueries, indexes.",tag:"DBMS"},
    {title:"Tree/graph test + DBMS mock",detail:"Review mistakes; revise ACID and normalization.",tag:"Review"}
  ]},
  { title:"Operating systems, networks & project mastery", subtitle:"CS fundamentals and architecture", days:[
    {title:"Processes vs threads",detail:"Scheduling, context switching and concurrency.",tag:"OS"},
    {title:"Deadlocks + memory",detail:"Four deadlock conditions, paging, virtual memory.",tag:"OS"},
    {title:"Heap + priority queue",detail:"Heap operations and common use cases.",tag:"DSA"},
    {title:"Greedy + mixed arrays",detail:"Greedy reasoning; revisit weak array patterns.",tag:"DSA"},
    {title:"HTTP, TCP/UDP, DNS",detail:"Trace what happens after entering a URL.",tag:"Networks"},
    {title:"AdyTalk architecture",detail:"WebRTC, Socket.IO signaling, rooms, authentication.",tag:"Projects"},
    {title:"PlacementPilot + CS review",detail:"Firebase, Firestore rules, data model, weekly review.",tag:"Projects"}
  ]},
  { title:"Mixed DSA & interview practice", subtitle:"Timed problems and communication", days:[
    {title:"Timed arrays + hashing",detail:"Mixed problems without topic hints.",tag:"Mock"},
    {title:"Linked list + stack assessment",detail:"Solve under time pressure and explain complexity.",tag:"Mock"},
    {title:"Trees + binary search assessment",detail:"Test patterns and boundary conditions.",tag:"Mock"},
    {title:"Graphs + recursion assessment",detail:"Review traversal and backtracking mistakes.",tag:"Mock"},
    {title:"SQL + DBMS + OOP oral mock",detail:"Answer aloud with examples.",tag:"Mock"},
    {title:"Coding mock + review",detail:"Simulate interviewer communication; log feedback.",tag:"Mock"},
    {title:"Project + behavioral mock",detail:"Architecture deep dive and STAR stories.",tag:"Mock"}
  ]},
  { title:"Final simulations & interview readiness", subtitle:"Mocks, weak-area repair and applications", days:[
    {title:"Full coding mock",detail:"Two timed problems; analyze errors immediately.",tag:"Mock"},
    {title:"Weak-topic repair",detail:"Re-solve missed problems without looking at solutions.",tag:"Revision"},
    {title:"CS fundamentals mock",detail:"OOP, DBMS, SQL, OS and networking.",tag:"Mock"},
    {title:"Project deep dive",detail:"Defend both projects and validate claims against code.",tag:"Projects"},
    {title:"Combined technical mock",detail:"DSA + project discussion + CS fundamentals.",tag:"Mock"},
    {title:"Resume + HR + applications",detail:"Practice introduction, career story, eligibility and applications.",tag:"Career"},
    {title:"Final assessment + light revision",detail:"Review progress, make a next-step plan, avoid cramming.",tag:"Review"}
  ]}
];
export const initialProblems = [
  ["Two Sum","Arrays & Strings","Easy"],["Best Time to Buy and Sell Stock","Arrays & Strings","Easy"],
  ["Maximum Subarray","Arrays & Strings","Medium"],["Valid Anagram","Hashing","Easy"],
  ["Contains Duplicate","Hashing","Easy"],["Longest Substring Without Repeating Characters","Two Pointers / Sliding Window","Medium"],
  ["Reverse Linked List","Linked Lists","Easy"],["Linked List Cycle","Linked Lists","Easy"],
  ["Middle of the Linked List","Linked Lists","Easy"],["Valid Parentheses","Stacks & Queues","Easy"],
  ["Min Stack","Stacks & Queues","Medium"],["Binary Search","Binary Search","Easy"],
  ["Search in Rotated Sorted Array","Binary Search","Medium"],["Maximum Depth of Binary Tree","Trees & BST","Easy"],
  ["Diameter of Binary Tree","Trees & BST","Easy"],["Invert Binary Tree","Trees & BST","Easy"],
  ["Validate Binary Search Tree","Trees & BST","Medium"],["Lowest Common Ancestor","Trees & BST","Medium"],
  ["Binary Tree Level Order Traversal","Trees & BST","Medium"],["Number of Islands","Graphs","Medium"],
  ["Climbing Stairs","Recursion / Backtracking","Easy"],["Subsets","Recursion / Backtracking","Medium"],
  ["Kth Largest Element in an Array","Heap / Greedy","Medium"]
].map(([name,category,difficulty],i)=>({id:i+1,name,category,difficulty,status:"todo" as const,url:"",notes:""}));