import Footer from "@/components/Footer";
import Header from "@/components/Header";
import React, { useState } from "react";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen flex-col flex gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      <Header variant="transparent" className="fixed w-full z-50" />
      {/* Header */}
      <section className="relative h-[380px]  md:h-[280px] mt-20 overflow-visible z-10">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            className="w-full h-full  max-md:h-[390px]  object-cover"
            src="https://api.builder.io/api/v1/image/assets/TEMP/58bfed58f49dafc4198cf3dc2d050bc688e7aca8?width=2880"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-black/20 max-md:h-[390px]" />
        </div>

        {/* Content */}
        <div className="w-full relative z-10 h-full flex flex-col">
          {/* Navigation */}

          {/* Hero Content */}
          
            <header className=" mt-20  w-full h-full mx-auto  py-4">
              
                <h1 className="text-white text-5xl text-center font-semibold">
                  Conditions générales d'utilisation
                </h1>
              
            </header>
        
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto flex flex-col gap-5 p-4 max-w-4xl">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Last updated: <strong>Insert Date</strong>
        </p>
        <h2 className="text-xl font-bold mt-6 mb-3">1. Acceptance of Terms</h2>
        <p>
          By accessing this website, you agree to comply with and be legally
          bound by these terms...
        </p>
        <h2 className="text-xl font-bold mt-6 mb-3">2. Use of the Website</h2>
        <p>
          You may use this website only for lawful purposes and in a way that
          does not infringe the rights of others...
        </p>
        <h2 className="text-xl font-bold mt-6 mb-3">3. Données personnelles</h2>
        <p className="underline">Typologie des données collectées :</p>
        <p>
          Les données collectées et ultérieurement traitées par UNIFLOW sont
          celles que le Client transmet volontairement via le formulaire de
          contact sur le SITE à UNIFLOW. Ces données correspondent au nom et à
          l’email de l’INTERNAUTE.
        </p>
        <p className="underline">
          {" "}
          Finalité de la collecte des données personnelles :
        </p>
        <p>
          Les INTERNAUTES autorisent UNIFLOW à sauvegarder ces informations
          personnelles dans un fichier de UNIFLOW, en vue du traitement de son
          courriel de contact.{" "}
        </p>
        <p>
          Ces données seront également utilisées pour répondre à l’INTERNAUTE.
        </p>
        <p>Transmission des données à des tiers : </p>
        <p>
          {" "}
          Les données collectées pourront être, dans la mesure où cela s’avère
          nécessaire au regard des finalités énoncées ci-dessus, transmises aux
          prestataires techniques de UNIFLOW (prestataires informatiques,
          hébergeurs…) afin de répondre favorablement aux demandes de
          l’INTERNAUTE.
        </p>
        <p>
          {" "}
          UNIFLOW s’engage à ne pas transmettre les données fournies à des tiers
          autres et hors de l’Union européenne.
        </p>
        <p> Conservation des données :</p>
        <p>
          Les données collectées sont stockées et sont conservées pour une durée
          de 1 mois à compter de la réalisation des finalités visées ci-dessus
          dans le respect de la législation en vigueur.
        </p>{" "}
        <p> Droit d’accès et de rectification :</p>
        <p>
          L’INTERNAUTE est informé que, conformément aux réglementations
          françaises et européennes en vigueur, il dispose des droits suivants
          sous réserve de justifier de son identité :
        </p>
        <p>
          {" "}
          • Le droit de s'opposer, pour des motifs légitimes, à ce que les
          données à caractère personnel le concernant fassent l'objet de
          traitements autres que ceux annoncés aux présentes auxquels il a
          consenti ;
        </p>
        <p>
          {" "}
          • Le droit de s'opposer, sans frais, à ce que les données collectées
          fassent l'objet d'un traitement commercial actuel ou futur par le
          responsable du traitement ;
        </p>
        <p>
          {" "}
          • Le droit de s'informer sur les traitements auxquels ses données à
          caractère personnel donnent lieu ;
        </p>
        <p>
          • Le droit d'obtenir des informations relatives aux traitements
          concernant les données à caractère personnel gérées par UNIFLOW et
          toutes informations permettant de connaître et, au besoin, contester
          la logique qui préside aux traitements des dites données ;
        </p>
        <p>
          {" "}
          • Le droit d'obtenir copie des données à caractère personnel le
          concernant, ainsi qu'un droit de rectification, de portabilité, de
          mise à jour ou de suppression de tout ou partie des dites données ;
        </p>
        <p>
          {" "}
          Pour toute question ou demande relative à la protection de la vie
          privée, les INTERNAUTES pourront contacter UNIFLOW à l’adresse
          suivante : contact@uniflow.agency
        </p>
        <p>
          {" "}
          L’INTERNAUTE est informé que s’il ne souhaite pas faire l’objet de
          prospection commerciale par voie téléphonique, il peut s’inscrire
          gratuitement sur une liste d’opposition au démarchage, par exemple :
          www.bloctel.gouv.fr.
        </p>
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Your Company. All rights reserved.
        </p>
      </main>

      <Footer />
    </div>
  );
}
