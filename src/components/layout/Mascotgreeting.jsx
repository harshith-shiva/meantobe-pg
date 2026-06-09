export default function MascotGreeting({ imageSrc = './assets/mascot.png' }) {
  return (
    <div style={styles.wrapper}>
      <img
        src={imageSrc}
        alt="mascot"
        style={styles.img}
        draggable={false}
      />
      <style>{`
        @keyframes mgBob {
          0%   { transform: translateY(0px);   }
          100% { transform: translateY(-5px);  }
        }
        @keyframes mgLegs {
          0%   { transform: rotate(-8deg) translateY(0px);  }
          100% { transform: rotate(8deg)  translateY(2px);  }
        }
      `}</style>
    </div>
  )
}

const styles = {
  wrapper: {
    width:          '100%',
    display:        'flex',
    justifyContent: 'center',
    alignItems:     'flex-end',
    paddingBottom:  0,
    overflow:       'visible',
    // bob the whole mascot gently
    animation:      'mgBob 1.1s ease-in-out infinite alternate',
  },
  img: {
    width:         '58px',
    height:        '58px',
    objectFit:     'contain',
    objectPosition:'bottom',
    pointerEvents: 'none',
    userSelect:    'none',
    display:       'block',
     transform: 'translate(-12px,10px)',
    //  transform: 'translateX(-15px)',
  },
}