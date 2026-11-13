// What a Game Details section shows while it has nothing yet: a headline and a line of text, laid out
// like the recap article.
export default function DetailEmpty({ title, message }: { title: string; message: string }) {
  return (
    <article className="flex flex-col gap-6 text-white">
      <h3 className="font-display font-extrabold text-[30px] leading-tight">{title}</h3>
      <p className="text-[17px] leading-[26px] text-white/85">{message}</p>
    </article>
  );
}
