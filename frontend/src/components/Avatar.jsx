// Mostra a foto do usuário (data URL) quando existir; senão, cai no emoji.
export default function Avatar({ photo, avatar, size = 32, round = true }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className="avatar-photo"
        style={{ width: size, height: size, borderRadius: round ? '50%' : 8 }}
      />
    )
  }
  return <>{avatar}</>
}
