import { ArrowUpRight, BedDouble, MapPin, ShieldCheck, Sparkles } from "lucide-react";

const roomTypes = [
  { name: "Standard", detail: "Kenyamanan esensial untuk perjalanan yang praktis." },
  { name: "Superior", detail: "Ruang lebih lega untuk beristirahat dengan tenang." },
  { name: "Deluxe", detail: "Pengalaman menginap dengan sentuhan ekstra." },
  { name: "Suite", detail: "Pilihan ruang premium untuk masa tinggal istimewa." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 md:px-10">
        <a href="#" className="flex items-center gap-3" aria-label="Nginap Java Hotel beranda">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#245746] text-white"><BedDouble size={21} /></span>
          <span><span className="block text-lg font-bold tracking-tight">nginap<span className="text-[#8b9b75]">.</span></span><span className="block text-[10px] uppercase tracking-[.22em] text-[#69756f]">Java Hotel</span></span>
        </a>
        <span className="rounded-full border border-[#dce4db] bg-white px-4 py-2 text-xs font-semibold text-[#476457]">Reservasi online segera hadir</span>
      </header>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1.02fr_.98fr] md:px-10 md:pb-28 md:pt-16">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e8eee7] px-4 py-2 text-xs font-semibold text-[#315c4b]"><Sparkles size={14} /> Pengalaman menginap di Jakarta Selatan</div>
          <h1 className="font-display text-5xl leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">Tempat singgah,<br/><span className="italic text-[#66816d]">ruang untuk pulih.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-8 text-[#69756f]">Selamat datang di Java Hotel. Temukan kenyamanan menginap dengan pilihan kamar yang sesuai dengan perjalanan Anda.</p>
          <div className="mt-9"><span className="inline-flex items-center gap-2 rounded-full bg-[#245746] px-5 py-3 text-sm font-semibold text-white"><ShieldCheck size={16}/> Reservasi dikonfirmasi setelah ketersediaan berhasil diperiksa</span></div>
          <div className="mt-10 flex items-start gap-3 border-t border-[#e0e6df] pt-6 text-sm leading-6 text-[#69756f]"><MapPin className="mt-1 shrink-0 text-[#66816d]" size={18}/><span>Jalan Jend. Sudirman No. 40–45,<br/>Jakarta Selatan, DKI Jakarta, Indonesia</span></div>
        </div>
        <div className="relative">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-[#e8eee7] blur-2xl" />
          <div className="relative min-h-[390px] overflow-hidden rounded-[2rem] bg-[#d9e1d8] shadow-xl md:min-h-[540px]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(21,53,42,.08),rgba(21,53,42,.52)),url('https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center" role="img" aria-label="Interior kamar hotel modern yang hangat" />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/30 bg-white/90 p-5 backdrop-blur-md md:inset-x-7 md:bottom-7">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#66816d]">Your stay, thoughtfully made</p>
              <p className="font-display mt-2 text-2xl">Selamat datang di Java Hotel.</p>
              <p className="mt-2 text-sm text-[#69756f]">Jakarta Selatan · Indonesia</p>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-[#e4e9e3] bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#66816d]">Pilihan akomodasi</p><h2 className="font-display mt-3 text-3xl md:text-4xl">Temukan ruang istirahat Anda</h2></div><p className="max-w-sm text-sm leading-6 text-[#69756f]">Empat kategori kamar akan tersedia untuk dipilih sesuai kebutuhan perjalanan.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{roomTypes.map((room, index) => <article key={room.name} className="rounded-2xl border border-[#e4e9e3] bg-[#fbfcfa] p-6"><span className="text-xs font-semibold text-[#8b9b75]">0{index + 1}</span><h3 className="font-display mt-5 text-2xl">{room.name}</h3><p className="mt-3 min-h-12 text-sm leading-6 text-[#69756f]">{room.detail}</p><div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#476457]">Kategori kamar <ArrowUpRight size={14}/></div></article>)}</div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-[#69756f] md:flex-row md:items-center md:justify-between md:px-10"><span>© {new Date().getFullYear()} Nginap · Java Hotel</span><span>Jalan Jend. Sudirman No. 40–45, Jakarta Selatan</span></footer>
    </main>
  );
}
