function origin() {
  if (import.meta.env.VITE_API_ORIGIN) {
    return import.meta.env.VITE_API_ORIGIN;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('//')) return url;
  if (url.startsWith('/uploads')) return `${origin()}${url}`;
  return url;
};

/** Netflix-style: always play through server stream API */
export const resolveVideoUrl = (movie) => {
  if (!movie?.id) return '';
  return `${origin()}/api/movies/${movie.id}/stream`;
};

export const fetchPlaybackInfo = async (api, movieId) => {
  const res = await api.get(`/movies/${movieId}/playback`);
  return res.data;
};

export default origin;
