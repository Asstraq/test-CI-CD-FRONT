import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>&quot;To determine&quot;</h1>
          <Link href={'/auth'}>Connexion</Link>
        </div>
      </main>
    </div>
  );
}
