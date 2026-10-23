import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNotice() {
  return (
    <>
      <h1>Mentions légales</h1>
      <h2>Éditeur</h2>
      <p>
        [Raison sociale ou nom de l&apos;entrepreneur], [forme juridique] au capital de [montant] €, immatriculée
        sous le numéro [SIREN/SIRET], dont le siège est situé [adresse].
      </p>
      <p>Directeur de la publication : [nom]. Contact : [adresse e-mail].</p>
      <h2>Hébergement</h2>
      <p>
        Site hébergé par [Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis]. Base de données
        hébergée par [fournisseur et adresse], dans l&apos;Union européenne.
      </p>
      <h2>Nature du service</h2>
      <p>
        Allégo est un service d&apos;accompagnement à la perte de poids qui fournit des repères généraux. Il ne
        constitue ni un dispositif médical, ni un avis médical, et ne remplace pas une consultation auprès
        d&apos;un médecin ou d&apos;un diététicien.
      </p>
    </>
  );
}
