import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Privacy() {
  return (
    <>
      <h1>Politique de confidentialité</h1>
      <p>
        Responsable du traitement : [raison sociale], [adresse], [adresse e-mail de contact].
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>Compte : prénom, adresse e-mail, mot de passe (enregistré sous forme chiffrée et irréversible).</li>
        <li>
          Données de santé : sexe, date de naissance, taille, poids, poids visé, niveau d&apos;activité, repas et
          activités notés.
        </li>
        <li>
          Paiement : identifiant de l&apos;abonnement PayPal et historique des paiements. Allégo ne reçoit jamais
          vos coordonnées bancaires, qui restent chez PayPal.
        </li>
      </ul>

      <h2>Pourquoi et sur quelle base</h2>
      <ul>
        <li>Fournir le service (calcul de l&apos;objectif, suivi, programme) : exécution du contrat.</li>
        <li>
          Traiter vos données de santé : votre consentement explicite, donné à l&apos;inscription (article 9.2.a du
          RGPD). Vous pouvez le retirer à tout moment en supprimant votre compte.
        </li>
        <li>Facturation et comptabilité : obligation légale.</li>
      </ul>
      <p>Vos données ne sont jamais vendues ni utilisées à des fins publicitaires.</p>

      <h2>Destinataires</h2>
      <ul>
        <li>[Hébergeur du site] et [hébergeur de la base de données], en qualité de sous-traitants.</li>
        <li>PayPal (Europe) S.à r.l. et Cie, S.C.A., pour les paiements.</li>
        <li>
          Resend [raison sociale exacte à reprendre du contrat], société établie aux États-Unis, pour l&apos;envoi des e-mails : il reçoit uniquement votre
          prénom et votre adresse e-mail, jamais vos mesures. [Transfert encadré par les clauses contractuelles
          types de la Commission européenne : à vérifier dans le contrat Resend.]
        </li>
      </ul>

      <h2>Durée de conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte existe, puis effacées immédiatement à sa suppression.
        Les pièces comptables sont conservées 10 ans conformément à la loi. Un compte inactif depuis [3 ans] est
        supprimé après un e-mail de rappel.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez accéder à vos données, les rectifier, les télécharger et les effacer directement depuis la
        page Mon compte. Pour toute autre demande (opposition, limitation), écrivez à [adresse e-mail]. Vous pouvez
        aussi adresser une réclamation à la CNIL (cnil.fr).
      </p>

      <h2>Cookies</h2>
      <p>
        Allégo utilise un seul cookie, strictement nécessaire, pour garder votre session ouverte. Aucun cookie de
        mesure d&apos;audience ou de publicité n&apos;est déposé.
      </p>
    </>
  );
}
