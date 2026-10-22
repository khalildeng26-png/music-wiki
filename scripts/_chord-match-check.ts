// 和弦反查匹配算法自检(由 scripts/check-chord-match.mjs 经 vite SSR 加载执行)
import { matchChords, matchShape, nearestShape, pitchClass } from '@/lib/chord-match';
import { CHORDS, chordNotes, fretsToNotes } from '@/lib/chords';

export async function run() {
  let pass = 0;
  let fail = 0;
  const ok = (c: unknown, n: string) => {
    if (c) pass++;
    else {
      fail++;
      console.error('✗ FAIL:', n);
    }
  };

  // 音级化
  ok(pitchClass('Bb3') === 'Bb' && pitchClass('E2') === 'E', '音名→音级');

  // 每个和弦都能被自己认出来(带位置:同音异名也能定夺)
  for (const c of CHORDS) {
    const pos = c.frets.map((f, s) => ({ s, f })).filter((p) => p.f >= 0);
    const m = matchChords(chordNotes(c), 3, pos);
    ok(m.length > 0 && m[0].kind === 'exact', `${c.name} 自匹配为 exact(实际 ${m[0]?.kind})`);
    ok(m[0]?.chord.name === c.name, `${c.name} 首选即自身(实际 ${m[0]?.chord.name})`);
  }

  // 缺音 → missing
  {
    const c = CHORDS.find((x) => x.name === 'C')!;
    const partial = matchChords(chordNotes(c).slice(0, 2));
    ok(
      partial.some((p) => p.kind === 'missing' && p.chord.name === 'C'),
      `C 少按两音 → missing(实际 ${partial.map((p) => p.chord.name + ':' + p.kind).join(',')})`,
    );
  }

  // 多音 → extra(加的音必须在和弦音级之外:C 已含 G,加 G 不改变集合)
  {
    const c = CHORDS.find((x) => x.name === 'C')!;
    const m = matchChords([...chordNotes(c), 'D4']);
    ok(
      m.some((p) => p.kind === 'extra' && p.chord.name === 'C'),
      `C 加 D → extra(实际 ${m.map((p) => p.chord.name + ':' + p.kind).join(',')})`,
    );
    const mG = matchChords([...chordNotes(c), 'G4']);
    ok(mG[0]?.kind === 'exact' && mG[0]?.chord.name === 'C', 'C 加 G 仍是 C(音级集合未变)');
  }

  // 同音异名:Dsus2 与 Asus4 音级相同,按位置定夺
  {
    for (const name of ['Dsus2', 'Asus4', 'Asus2', 'Esus4']) {
      const c = CHORDS.find((x) => x.name === name)!;
      const pos = c.frets.map((f, s) => ({ s, f })).filter((p) => p.f >= 0);
      const m = matchChords(chordNotes(c), 3, pos);
      ok(
        m[0]?.chord.name === name && m[0]?.shapeMatch,
        `${name} 按位置优先(实际 ${m[0]?.chord.name}, shapeMatch=${m[0]?.shapeMatch})`,
      );
    }
  }

  // 空输入
  ok(matchChords([]).length === 0, '空输入无结果');

  // 位置匹配
  for (const name of ['C', 'G', 'Em', 'F', 'Dm']) {
    const c = CHORDS.find((x) => x.name === name)!;
    const pos = c.frets.map((f, s) => ({ s, f })).filter((p) => p.f >= 0);
    const m = matchShape(pos);
    ok(m?.chord.name === name, `${name} 标准按法位置匹配(实际 ${m?.chord.name})`);
  }

  // nearestShape
  {
    const m = nearestShape([
      { s: 0, f: 3 },
      { s: 1, f: 2 },
    ]);
    ok(!!m && m.chord.frets.length === 6, 'nearestShape 有结果');
  }

  // exact 优先
  {
    const m = matchChords(chordNotes(CHORDS.find((x) => x.name === 'Em')!));
    ok(m[0].kind === 'exact', 'exact 排在最前');
  }

  // fretsToNotes 与 chordNotes 一致
  {
    const c = CHORDS.find((x) => x.name === 'F')!;
    ok(
      JSON.stringify(fretsToNotes(c.frets)) === JSON.stringify(chordNotes(c)),
      'fretsToNotes 与 chordNotes 一致',
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
}
