import type { Metadata } from "next";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";

export const metadata: Metadata = { title: "Conditions générales" };

export default function Terms() {
  return (
    <>
      <h1>Conditions générales d&apos;utilisation et de vente</h1>

      <h2>Le service</h2>
      <p>
        Allégo, édité par [raison sociale], propose un accompagnement en ligne à la perte de poids : calcul
        d&apos;un objectif calorique, suivi du poids, journal alimentaire, suivi des activités et programme
        hebdomadaire. Le service est réservé aux personnes majeures.
      </p>
      <p>
        Les informations fournies sont des repères généraux. Elles ne constituent pas un avis médical. Le service
        n&apos;est pas adapté aux femmes enceintes ou allaitantes, aux personnes atteintes d&apos;une maladie
        chronique ou de troubles du comportement alimentaire, qui doivent consulter un professionnel de santé.
      </p>

      <h2>Essai gratuit</h2>
      <p>
        Chaque nouveau compte bénéficie de {TRIAL_DAYS} jours d&apos;accès gratuit, sans moyen de paiement. À la fin
        de l&apos;essai, l&apos;accès au service nécessite un abonnement.
      </p>

      <h2>Abonnements et prix</h2>
      <ul>
        <li>Formule mensuelle : {PLANS.mensuel.price} TTC par mois.</li>
        <li>Formule annuelle : {PLANS.annuel.price} TTC par an.</li>
      </ul>
      <p>
        Le paiement est effectué par l&apos;intermédiaire de PayPal. L&apos;abonnement est reconduit automatiquement
        à chaque échéance jusqu&apos;à sa résiliation. Si vous vous abonnez pendant l&apos;essai gratuit, le premier
        prélèvement a lieu à la fin de l&apos;essai.
      </p>

      <h2>Résiliation</h2>
      <p>
        Vous pouvez résilier à tout moment depuis la page Abonnement ou depuis votre compte PayPal. La résiliation
        prend effet à la fin de la période en cours, déjà payée, et aucun autre prélèvement n&apos;a lieu.
      </p>

      <h2>Droit de rétractation</h2>
      <p>
        Vous disposez d&apos;un délai de 14 jours à compter de la souscription pour vous rétracter (article L221-18
        du Code de la consommation). [À adapter : en demandant l&apos;accès immédiat au service, vous reconnaissez
        que le montant correspondant au service déjà fourni reste dû en cas de rétractation.] Pour exercer ce droit,
        écrivez à [adresse e-mail].
      </p>

      <h2>Responsabilité</h2>
      <p>
        [Raison sociale] met tout en œuvre pour assurer l&apos;accès au service mais ne peut garantir une
        disponibilité permanente. Les résultats de perte de poids dépendent de chaque personne et ne sont pas
        garantis.
      </p>

      <h2>Médiation et droit applicable</h2>
      <p>
        En cas de litige, vous pouvez recourir gratuitement au médiateur de la consommation [nom et coordonnées].
        Les présentes conditions sont soumises au droit français.
      </p>
    </>
  );
}
