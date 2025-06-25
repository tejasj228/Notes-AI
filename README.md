// ...existing code...
              {/* Remove image collage from note card preview */}
              {/* {(() => {
  const images = extractImageSrcs(note.content, 4);
  if (images.length === 0) return null;
  return (
    <div className={`note-images-collage images-${images.length}`}>
      {images.map((src, idx) => (
        <img key={idx} src={src} alt="note" />
      ))}
    </div>
  );
})()} */}
            </div>
          ))}
// ...existing code...

// Remove extractImageSrcs function at the bottom
// function extractImageSrcs(html, max = 4) {
//   if (!html) return [];
//   const div = document.createElement('div');
//   div.innerHTML = html;
//   const imgs = Array.from(div.querySelectorAll('img')).slice(0, max);
//   return imgs.map(img => img.src);
// }
// ...existing
